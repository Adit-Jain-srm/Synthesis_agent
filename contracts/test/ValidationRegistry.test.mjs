import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("ValidationRegistry (ERC-8004 Validation)", function () {
  let registry, validation;
  let owner, agentOwner, validator, other;
  let agentId;

  beforeEach(async function () {
    [owner, agentOwner, validator, other] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("AgentRegistry");
    registry = await Registry.deploy();

    const Validation = await ethers.getContractFactory("ValidationRegistry");
    validation = await Validation.deploy(await registry.getAddress());

    const tx = await registry.connect(agentOwner)["register(string)"]("ipfs://agent.json");
    await tx.wait();
    agentId = 0n;
  });

  it("creates a validation request", async function () {
    const requestHash = ethers.keccak256(ethers.toUtf8Bytes("request-payload-1"));

    await expect(
      validation.connect(agentOwner).validationRequest(
        validator.address, agentId, "ipfs://request.json", requestHash
      )
    ).to.emit(validation, "ValidationRequest")
      .withArgs(validator.address, agentId, "ipfs://request.json", requestHash);

    const hashes = await validation.getAgentValidations(agentId);
    expect(hashes.length).to.equal(1);
    expect(hashes[0]).to.equal(requestHash);
  });

  it("rejects request from non-agent-owner", async function () {
    const requestHash = ethers.keccak256(ethers.toUtf8Bytes("bad-request"));
    await expect(
      validation.connect(other).validationRequest(
        validator.address, agentId, "ipfs://hack.json", requestHash
      )
    ).to.be.revertedWith("Not agent owner");
  });

  it("allows validator to respond", async function () {
    const requestHash = ethers.keccak256(ethers.toUtf8Bytes("request-2"));
    await validation.connect(agentOwner).validationRequest(
      validator.address, agentId, "ipfs://req.json", requestHash
    );

    const responseHash = ethers.keccak256(ethers.toUtf8Bytes("response-data"));
    await expect(
      validation.connect(validator).validationResponse(
        requestHash, 95, "ipfs://response.json", responseHash, "accuracy"
      )
    ).to.emit(validation, "ValidationResponse");

    const [vAddr, aId, resp, rHash, tag, lastUpdate] = await validation.getValidationStatus(requestHash);
    expect(vAddr).to.equal(validator.address);
    expect(aId).to.equal(agentId);
    expect(resp).to.equal(95);
    expect(tag).to.equal("accuracy");
    expect(lastUpdate).to.be.greaterThan(0);
  });

  it("rejects response from non-validator", async function () {
    const requestHash = ethers.keccak256(ethers.toUtf8Bytes("request-3"));
    await validation.connect(agentOwner).validationRequest(
      validator.address, agentId, "ipfs://req.json", requestHash
    );

    await expect(
      validation.connect(other).validationResponse(
        requestHash, 100, "", ethers.ZeroHash, ""
      )
    ).to.be.revertedWith("Not the validator");
  });

  it("allows multiple responses for progressive validation", async function () {
    const requestHash = ethers.keccak256(ethers.toUtf8Bytes("request-4"));
    await validation.connect(agentOwner).validationRequest(
      validator.address, agentId, "ipfs://req.json", requestHash
    );

    await validation.connect(validator).validationResponse(
      requestHash, 50, "", ethers.ZeroHash, "soft-finality"
    );

    let [,,,, tag1] = await validation.getValidationStatus(requestHash);
    expect(tag1).to.equal("soft-finality");

    await validation.connect(validator).validationResponse(
      requestHash, 100, "ipfs://final-proof.json", ethers.ZeroHash, "hard-finality"
    );

    let [,,resp,, tag2] = await validation.getValidationStatus(requestHash);
    expect(resp).to.equal(100);
    expect(tag2).to.equal("hard-finality");
  });

  it("computes summary across validations", async function () {
    const hash1 = ethers.keccak256(ethers.toUtf8Bytes("req-a"));
    const hash2 = ethers.keccak256(ethers.toUtf8Bytes("req-b"));

    await validation.connect(agentOwner).validationRequest(
      validator.address, agentId, "ipfs://a.json", hash1
    );
    await validation.connect(agentOwner).validationRequest(
      validator.address, agentId, "ipfs://b.json", hash2
    );

    await validation.connect(validator).validationResponse(
      hash1, 90, "", ethers.ZeroHash, "accuracy"
    );
    await validation.connect(validator).validationResponse(
      hash2, 80, "", ethers.ZeroHash, "accuracy"
    );

    const [count, avg] = await validation.getSummary(agentId, [validator.address], "accuracy");
    expect(count).to.equal(2);
    expect(avg).to.equal(85);
  });

  it("tracks validator requests", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("track-req"));
    await validation.connect(agentOwner).validationRequest(
      validator.address, agentId, "ipfs://t.json", hash
    );

    const requests = await validation.getValidatorRequests(validator.address);
    expect(requests.length).to.equal(1);
    expect(requests[0]).to.equal(hash);
  });
});
