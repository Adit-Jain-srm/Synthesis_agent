import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("AgentTrust — ERC-8004 Aligned", function () {
  let registry, reputation, commitment;
  let owner, user1, user2, user3;
  let agent1Id, agent2Id;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("AgentRegistry");
    registry = await Registry.deploy();

    const Reputation = await ethers.getContractFactory("ReputationManager");
    reputation = await Reputation.deploy(await registry.getAddress());

    const Commitment = await ethers.getContractFactory("CommitmentEngine");
    commitment = await Commitment.deploy(await registry.getAddress());

    const tx1 = await registry.connect(user1)["register(string)"]("ipfs://agent1-registration.json");
    await tx1.wait();
    agent1Id = 0n;

    const tx2 = await registry.connect(user2)["register(string)"]("ipfs://agent2-registration.json");
    await tx2.wait();
    agent2Id = 1n;
  });

  describe("AgentRegistry (ERC-8004 Identity)", function () {
    it("mints ERC-721 NFT on registration", async function () {
      expect(await registry.ownerOf(agent1Id)).to.equal(user1.address);
      expect(await registry.ownerOf(agent2Id)).to.equal(user2.address);
    });

    it("stores agent URI (token URI)", async function () {
      expect(await registry.tokenURI(agent1Id)).to.equal("ipfs://agent1-registration.json");
    });

    it("sets agent wallet to owner on registration", async function () {
      expect(await registry.getAgentWallet(agent1Id)).to.equal(user1.address);
    });

    it("allows owner to update agent URI", async function () {
      await registry.connect(user1).setAgentURI(agent1Id, "ipfs://updated.json");
      expect(await registry.tokenURI(agent1Id)).to.equal("ipfs://updated.json");
    });

    it("rejects non-owner URI update", async function () {
      await expect(
        registry.connect(user2).setAgentURI(agent1Id, "ipfs://hack.json")
      ).to.be.revertedWith("Not agent owner");
    });

    it("supports on-chain metadata key-value storage", async function () {
      await registry.connect(user1).setMetadata(agent1Id, "model", ethers.toUtf8Bytes("gpt-4o"));
      const val = await registry.getMetadata(agent1Id, "model");
      expect(ethers.toUtf8String(val)).to.equal("gpt-4o");
    });

    it("blocks setting agentWallet via setMetadata", async function () {
      await expect(
        registry.connect(user1).setMetadata(agent1Id, "agentWallet", ethers.toUtf8Bytes("0x00"))
      ).to.be.revertedWith("Use setAgentWallet");
    });

    it("allows owner to change agent wallet", async function () {
      await registry.connect(user1).setAgentWallet(agent1Id, user3.address);
      expect(await registry.getAgentWallet(agent1Id)).to.equal(user3.address);
    });

    it("clears agent wallet on transfer", async function () {
      await registry.connect(user1).transferFrom(user1.address, user3.address, agent1Id);
      expect(await registry.getAgentWallet(agent1Id)).to.equal(ethers.ZeroAddress);
      expect(await registry.ownerOf(agent1Id)).to.equal(user3.address);
    });

    it("registers without URI", async function () {
      const tx = await registry.connect(user3)["register()"]();
      const receipt = await tx.wait();
      expect(await registry.isRegistered(2n)).to.be.true;
      expect(await registry.ownerOf(2n)).to.equal(user3.address);
    });

    it("tracks total agents", async function () {
      expect(await registry.totalAgents()).to.equal(2n);
    });
  });

  describe("ReputationManager (ERC-8004 Reputation)", function () {
    it("accepts feedback from non-owner", async function () {
      await reputation.connect(user2).giveFeedback(
        agent1Id, 85, 0, "starred", "", "", "", ethers.ZeroHash
      );
      const [value, decimals, tag1, tag2, revoked] = await reputation.readFeedback(agent1Id, user2.address, 1);
      expect(value).to.equal(85);
      expect(tag1).to.equal("starred");
      expect(revoked).to.be.false;
    });

    it("rejects self-review (owner reviewing own agent)", async function () {
      await expect(
        reputation.connect(user1).giveFeedback(agent1Id, 100, 0, "starred", "", "", "", ethers.ZeroHash)
      ).to.be.revertedWith("Cannot self-review");
    });

    it("tracks feedback index per client", async function () {
      await reputation.connect(user2).giveFeedback(agent1Id, 80, 0, "starred", "", "", "", ethers.ZeroHash);
      await reputation.connect(user2).giveFeedback(agent1Id, 90, 0, "starred", "", "", "", ethers.ZeroHash);
      expect(await reputation.getLastIndex(agent1Id, user2.address)).to.equal(2);
    });

    it("revokes feedback", async function () {
      await reputation.connect(user2).giveFeedback(agent1Id, 50, 0, "starred", "", "", "", ethers.ZeroHash);
      await reputation.connect(user2).revokeFeedback(agent1Id, 1);
      const [,,,, revoked] = await reputation.readFeedback(agent1Id, user2.address, 1);
      expect(revoked).to.be.true;
    });

    it("allows response appending", async function () {
      await reputation.connect(user2).giveFeedback(agent1Id, 70, 0, "starred", "", "", "", ethers.ZeroHash);
      await expect(
        reputation.connect(user1).appendResponse(agent1Id, user2.address, 1, "ipfs://response.json", ethers.ZeroHash)
      ).to.emit(reputation, "ResponseAppended");
    });

    it("computes summary across clients", async function () {
      await registry.connect(user3)["register()"]();
      await reputation.connect(user2).giveFeedback(agent1Id, 80, 0, "starred", "", "", "", ethers.ZeroHash);
      await reputation.connect(user3).giveFeedback(agent1Id, 60, 0, "starred", "", "", "", ethers.ZeroHash);

      const [count, summaryValue] = await reputation.getSummary(
        agent1Id, [user2.address, user3.address], "starred", ""
      );
      expect(count).to.equal(2);
      expect(summaryValue).to.equal(70);
    });

    it("returns clients list", async function () {
      await reputation.connect(user2).giveFeedback(agent1Id, 80, 0, "", "", "", "", ethers.ZeroHash);
      const clients = await reputation.getClients(agent1Id);
      expect(clients).to.include(user2.address);
    });
  });

  describe("CommitmentEngine (Agent Cooperation)", function () {
    it("creates and accepts a commitment using agentIds", async function () {
      const deadline = (await ethers.provider.getBlock("latest")).timestamp + 3600;
      const stake = ethers.parseEther("0.1");

      await commitment.connect(user1).propose(agent1Id, agent2Id, "Deliver dataset", deadline, { value: stake });
      expect(await commitment.getCommitmentCount()).to.equal(1);

      await commitment.connect(user2).accept(0, { value: stake });

      const c = await commitment.getCommitment(0);
      expect(c.status).to.equal(1n);
      expect(c.stake).to.equal(stake * 2n);
    });

    it("fulfills commitment with evidence hash", async function () {
      const deadline = (await ethers.provider.getBlock("latest")).timestamp + 3600;
      const stake = ethers.parseEther("0.1");
      const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("proof-of-work"));

      await commitment.connect(user1).propose(agent1Id, agent2Id, "Build API", deadline, { value: stake });
      await commitment.connect(user2).accept(0, { value: stake });
      await commitment.connect(user1).fulfill(0, "ipfs://proof.json", evidenceHash);

      const c = await commitment.getCommitment(0);
      expect(c.status).to.equal(2n);
      expect(c.evidenceHash).to.equal(evidenceHash);
    });

    it("handles expiry and returns stake to proposer wallet", async function () {
      const deadline = (await ethers.provider.getBlock("latest")).timestamp + 60;
      const stake = ethers.parseEther("0.1");

      await commitment.connect(user1).propose(agent1Id, agent2Id, "Quick task", deadline, { value: stake });

      await ethers.provider.send("evm_increaseTime", [120]);
      await ethers.provider.send("evm_mine");

      await commitment.connect(user1).claimExpired(0);
      const c = await commitment.getCommitment(0);
      expect(c.status).to.equal(5n);
    });

    it("allows disputes", async function () {
      const deadline = (await ethers.provider.getBlock("latest")).timestamp + 3600;

      await commitment.connect(user1).propose(agent1Id, agent2Id, "Deliver work", deadline);
      await commitment.connect(user2).accept(0);
      await commitment.connect(user2).dispute(0);

      const c = await commitment.getCommitment(0);
      expect(c.status).to.equal(3n);
    });

    it("rejects proposals from non-agent-owners", async function () {
      const deadline = (await ethers.provider.getBlock("latest")).timestamp + 3600;
      await expect(
        commitment.connect(user3).propose(agent1Id, agent2Id, "Hack", deadline)
      ).to.be.revertedWith("Not agent owner");
    });
  });
});
