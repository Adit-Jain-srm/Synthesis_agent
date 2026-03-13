import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Registry = await ethers.getContractFactory("AgentRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("AgentRegistry deployed to:", registryAddr);

  const Reputation = await ethers.getContractFactory("ReputationManager");
  const reputation = await Reputation.deploy(registryAddr);
  await reputation.waitForDeployment();
  console.log("ReputationManager deployed to:", await reputation.getAddress());

  const Commitment = await ethers.getContractFactory("CommitmentEngine");
  const commitment = await Commitment.deploy(registryAddr);
  await commitment.waitForDeployment();
  console.log("CommitmentEngine deployed to:", await commitment.getAddress());

  console.log("\nAll contracts deployed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
