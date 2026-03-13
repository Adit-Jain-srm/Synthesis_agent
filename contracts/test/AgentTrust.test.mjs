import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("AgentTrust", function () {
  let registry, reputation, commitment;
  let owner, agent1, agent2, agent3;

  beforeEach(async function () {
    [owner, agent1, agent2, agent3] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("AgentRegistry");
    registry = await Registry.deploy();

    const Reputation = await ethers.getContractFactory("ReputationManager");
    reputation = await Reputation.deploy(await registry.getAddress());

    const Commitment = await ethers.getContractFactory("CommitmentEngine");
    commitment = await Commitment.deploy(await registry.getAddress());

    await registry.registerAgent(agent1.address, "Agent1", "ipfs://agent1");
    await registry.registerAgent(agent2.address, "Agent2", "ipfs://agent2");
  });

  describe("AgentRegistry", function () {
    it("should register an agent", async function () {
      expect(await registry.isRegistered(agent1.address)).to.be.true;
      const agent = await registry.agents(agent1.address);
      expect(agent.name).to.equal("Agent1");
      expect(agent.owner).to.equal(owner.address);
    });

    it("should reject duplicate registration", async function () {
      await expect(
        registry.registerAgent(agent1.address, "Dup", "ipfs://dup")
      ).to.be.revertedWith("Already registered");
    });

    it("should deactivate an agent", async function () {
      await registry.deactivateAgent(agent1.address);
      expect(await registry.isRegistered(agent1.address)).to.be.false;
    });

    it("should update metadata", async function () {
      await registry.updateMetadata(agent1.address, "ipfs://updated");
      const agent = await registry.agents(agent1.address);
      expect(agent.metadataURI).to.equal("ipfs://updated");
    });

    it("should count agents", async function () {
      expect(await registry.getAgentCount()).to.equal(2);
    });
  });

  describe("ReputationManager", function () {
    it("should create attestation between registered agents", async function () {
      await reputation
        .connect(agent1)
        .attest(agent2.address, 4, "Good data delivery");

      const [avgScore, count] = await reputation.getReputation(agent2.address);
      expect(count).to.equal(1);
      expect(avgScore).to.equal(400);
    });

    it("should reject self-attestation", async function () {
      await expect(
        reputation.connect(agent1).attest(agent1.address, 5, "self")
      ).to.be.revertedWith("Cannot self-attest");
    });

    it("should reject unregistered attester", async function () {
      await expect(
        reputation.connect(agent3).attest(agent2.address, 3, "test")
      ).to.be.revertedWith("Attester not registered");
    });

    it("should reject duplicate attestation", async function () {
      await reputation
        .connect(agent1)
        .attest(agent2.address, 4, "task1");
      await expect(
        reputation.connect(agent1).attest(agent2.address, 5, "task1")
      ).to.be.revertedWith("Duplicate attestation");
    });

    it("should calculate average reputation", async function () {
      await registry.registerAgent(agent3.address, "Agent3", "ipfs://agent3");

      await reputation
        .connect(agent1)
        .attest(agent2.address, 5, "task1");
      await reputation
        .connect(agent3)
        .attest(agent2.address, 3, "task2");

      const [avgScore, count] = await reputation.getReputation(agent2.address);
      expect(count).to.equal(2);
      expect(avgScore).to.equal(400);
    });
  });

  describe("CommitmentEngine", function () {
    it("should create and accept a commitment", async function () {
      const deadline = (await ethers.provider.getBlock("latest")).timestamp + 3600;
      const stake = ethers.parseEther("0.1");

      await commitment
        .connect(agent1)
        .propose(agent2.address, "Deliver dataset", deadline, { value: stake });

      expect(await commitment.getCommitmentCount()).to.equal(1);

      await commitment.connect(agent2).accept(0, { value: stake });

      const c = await commitment.getCommitment(0);
      expect(c.status).to.equal(1);
      expect(c.stake).to.equal(stake * 2n);
    });

    it("should fulfill a commitment", async function () {
      const deadline = (await ethers.provider.getBlock("latest")).timestamp + 3600;
      const stake = ethers.parseEther("0.1");

      await commitment
        .connect(agent1)
        .propose(agent2.address, "Build API", deadline, { value: stake });
      await commitment.connect(agent2).accept(0, { value: stake });

      await commitment.connect(agent1).fulfill(0, "ipfs://proof");

      const c = await commitment.getCommitment(0);
      expect(c.status).to.equal(2);
      expect(c.evidenceURI).to.equal("ipfs://proof");
    });

    it("should handle expiry and return stake to proposer", async function () {
      const deadline = (await ethers.provider.getBlock("latest")).timestamp + 60;
      const stake = ethers.parseEther("0.1");

      await commitment
        .connect(agent1)
        .propose(agent2.address, "Quick task", deadline, { value: stake });

      await ethers.provider.send("evm_increaseTime", [120]);
      await ethers.provider.send("evm_mine");

      await commitment.connect(agent1).claimExpired(0);

      const c = await commitment.getCommitment(0);
      expect(c.status).to.equal(5);
    });

    it("should allow disputes", async function () {
      const deadline = (await ethers.provider.getBlock("latest")).timestamp + 3600;

      await commitment
        .connect(agent1)
        .propose(agent2.address, "Deliver work", deadline);
      await commitment.connect(agent2).accept(0);

      await commitment.connect(agent2).dispute(0);

      const c = await commitment.getCommitment(0);
      expect(c.status).to.equal(3);
    });
  });
});
