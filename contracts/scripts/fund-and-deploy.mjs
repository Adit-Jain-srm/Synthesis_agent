import hre from "hardhat";
const { ethers } = hre;

async function checkAndDeploy() {
  const [deployer] = await ethers.getSigners();
  const network = hre.network.name;
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`Wallet:  ${deployer.address}`);
  console.log(`Network: ${network}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    console.log("╔════════════════════════════════════════════════════╗");
    console.log("║  Wallet has 0 ETH. Get Base Sepolia testnet ETH:  ║");
    console.log("║                                                    ║");
    console.log("║  1. Go to: sepolia-faucet.pk910.de                ║");
    console.log("║  2. Paste: " + deployer.address.slice(0, 20) + "...  ║");
    console.log("║  3. Complete captcha, mine ~30s, claim             ║");
    console.log("║  4. Bridge: bridge.base.org/deposit               ║");
    console.log("║                                                    ║");
    console.log("║  OR use any Base Sepolia faucet directly.          ║");
    console.log("║  Then re-run this script.                          ║");
    console.log("╚════════════════════════════════════════════════════╝");
    process.exit(1);
  }

  console.log("Balance sufficient. Starting deployment...\n");

  const { execSync } = await import("child_process");
  execSync(`npx hardhat run scripts/deploy-and-register.mjs --network ${network}`, {
    stdio: "inherit",
    cwd: process.cwd()
  });
}

checkAndDeploy().catch(console.error);
