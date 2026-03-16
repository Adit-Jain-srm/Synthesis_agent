import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const Registry = await ethers.getContractFactory("AgentRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("AgentRegistry (ERC-8004 Identity):", registryAddr);

  const Reputation = await ethers.getContractFactory("ReputationManager");
  const reputation = await Reputation.deploy(registryAddr);
  await reputation.waitForDeployment();
  const reputationAddr = await reputation.getAddress();
  console.log("ReputationManager (ERC-8004 Reputation):", reputationAddr);

  const Commitment = await ethers.getContractFactory("CommitmentEngine");
  const commitment = await Commitment.deploy(registryAddr);
  await commitment.waitForDeployment();
  const commitmentAddr = await commitment.getAddress();
  console.log("CommitmentEngine (Agent Cooperation):", commitmentAddr);

  const Validation = await ethers.getContractFactory("ValidationRegistry");
  const validation = await Validation.deploy(registryAddr);
  await validation.waitForDeployment();
  const validationAddr = await validation.getAddress();
  console.log("ValidationRegistry (ERC-8004 Validation):", validationAddr);

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify({
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      AgentRegistry: registryAddr,
      ReputationManager: reputationAddr,
      CommitmentEngine: commitmentAddr,
      ValidationRegistry: validationAddr
    }
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
