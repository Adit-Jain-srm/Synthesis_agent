import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";
import path from "path";

const AGENT_REGISTRATION = {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  name: "AditSynthesisAgent",
  description: "AI agent built by Adit Jain for The Synthesis hackathon. Implements the full AgentTrust protocol — on-chain identity, reputation, validation, and enforceable commitments for autonomous AI agent collaboration.",
  image: "",
  services: [
    {
      name: "web",
      endpoint: "https://github.com/Adit-Jain-srm/Synthesis_agent"
    }
  ],
  active: true,
  supportedTrust: ["reputation", "crypto-economic"],
  registrations: []
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = hre.network.name;
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`\n=== AgentTrust Deploy & Register ===`);
  console.log(`Network: ${network}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n && network !== "hardhat" && network !== "localhost") {
    console.error("ERROR: Deployer has 0 balance. Fund wallet first.");
    process.exit(1);
  }

  // --- Deploy ---
  console.log("▸ Deploying contracts...\n");

  const Registry = await ethers.getContractFactory("AgentRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log(`  AgentRegistry:       ${registryAddr}`);

  const Reputation = await ethers.getContractFactory("ReputationManager");
  const reputation = await Reputation.deploy(registryAddr);
  await reputation.waitForDeployment();
  const reputationAddr = await reputation.getAddress();
  console.log(`  ReputationManager:   ${reputationAddr}`);

  const Commitment = await ethers.getContractFactory("CommitmentEngine");
  const commitment = await Commitment.deploy(registryAddr);
  await commitment.waitForDeployment();
  const commitmentAddr = await commitment.getAddress();
  console.log(`  CommitmentEngine:    ${commitmentAddr}`);

  const Validation = await ethers.getContractFactory("ValidationRegistry");
  const validation = await Validation.deploy(registryAddr);
  await validation.waitForDeployment();
  const validationAddr = await validation.getAddress();
  console.log(`  ValidationRegistry:  ${validationAddr}\n`);

  // --- Register our agent ---
  console.log("▸ Registering AditSynthesisAgent on-chain...\n");

  const regFile = { ...AGENT_REGISTRATION };
  regFile.registrations = [{
    agentId: 0,
    agentRegistry: `eip155:${(await ethers.provider.getNetwork()).chainId}:${registryAddr}`
  }];

  const agentURI = `data:application/json;base64,${Buffer.from(JSON.stringify(regFile)).toString("base64")}`;
  const tx = await registry["register(string)"](agentURI);
  const receipt = await tx.wait();
  const agentId = 0n;

  console.log(`  Agent registered!`);
  console.log(`  agentId: ${agentId}`);
  console.log(`  NFT owner: ${await registry.ownerOf(agentId)}`);
  console.log(`  Agent wallet: ${await registry.getAgentWallet(agentId)}`);
  console.log(`  TX hash: ${receipt.hash}\n`);

  // --- Store metadata ---
  console.log("▸ Setting on-chain metadata...\n");

  await (await registry.setMetadata(agentId, "model", ethers.toUtf8Bytes("claude-4.6-opus"))).wait();
  await (await registry.setMetadata(agentId, "harness", ethers.toUtf8Bytes("cursor"))).wait();
  await (await registry.setMetadata(agentId, "hackathon", ethers.toUtf8Bytes("synthesis-2026"))).wait();
  await (await registry.setMetadata(agentId, "human", ethers.toUtf8Bytes("Adit Jain"))).wait();

  console.log(`  model: claude-4.6-opus`);
  console.log(`  harness: cursor`);
  console.log(`  hackathon: synthesis-2026`);
  console.log(`  human: Adit Jain\n`);

  // --- Save deployment info ---
  const deployment = {
    network,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AgentRegistry: registryAddr,
      ReputationManager: reputationAddr,
      CommitmentEngine: commitmentAddr,
      ValidationRegistry: validationAddr
    },
    agent: {
      agentId: 0,
      owner: deployer.address,
      txHash: receipt.hash
    }
  };

  const outPath = path.resolve("../deployments", `${network}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));
  console.log(`  Deployment saved to: deployments/${network}.json`);

  console.log("\n=== Deployment Complete ===\n");
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
