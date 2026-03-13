import hre from "hardhat";
const { ethers } = hre;

const AGENT1_REGISTRATION = JSON.stringify({
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  name: "DataProvider-Agent",
  description: "AI agent that delivers curated datasets on-demand. Specializes in financial and market data aggregation.",
  services: [
    { name: "MCP", endpoint: "https://mcp.dataprovider.example/", version: "2025-06-18" },
    { name: "web", endpoint: "https://dataprovider.example.com/" }
  ],
  active: true,
  supportedTrust: ["reputation"]
});

const AGENT2_REGISTRATION = JSON.stringify({
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  name: "Analyst-Agent",
  description: "AI agent that performs quantitative analysis and generates research reports from raw data.",
  services: [
    { name: "A2A", endpoint: "https://analyst.example/.well-known/agent-card.json", version: "0.3.0" }
  ],
  active: true,
  supportedTrust: ["reputation"]
});

async function main() {
  const [deployer, human1, human2, auditor] = await ethers.getSigners();

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║       AgentTrust — ERC-8004 Full Demo               ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // --- Deploy ---
  console.log("▸ Phase 1: Deploy contracts\n");

  const Registry = await ethers.getContractFactory("AgentRegistry");
  const registry = await Registry.deploy();
  const registryAddr = await registry.getAddress();

  const Reputation = await ethers.getContractFactory("ReputationManager");
  const reputation = await Reputation.deploy(registryAddr);

  const Commitment = await ethers.getContractFactory("CommitmentEngine");
  const commitment = await Commitment.deploy(registryAddr);

  console.log(`  AgentRegistry:     ${registryAddr}`);
  console.log(`  ReputationManager: ${await reputation.getAddress()}`);
  console.log(`  CommitmentEngine:  ${await commitment.getAddress()}\n`);

  // --- Register agents ---
  console.log("▸ Phase 2: Register AI agents (ERC-8004 Identity)\n");

  const agent1URI = `data:application/json;base64,${Buffer.from(AGENT1_REGISTRATION).toString("base64")}`;
  const agent2URI = `data:application/json;base64,${Buffer.from(AGENT2_REGISTRATION).toString("base64")}`;

  const tx1 = await registry.connect(human1)["register(string)"](agent1URI);
  const r1 = await tx1.wait();
  const agent1Id = 0n;
  console.log(`  ✓ DataProvider-Agent registered (agentId: ${agent1Id}, owner: ${human1.address})`);
  console.log(`    NFT owner: ${await registry.ownerOf(agent1Id)}`);
  console.log(`    Agent wallet: ${await registry.getAgentWallet(agent1Id)}`);

  const tx2 = await registry.connect(human2)["register(string)"](agent2URI);
  await tx2.wait();
  const agent2Id = 1n;
  console.log(`  ✓ Analyst-Agent registered (agentId: ${agent2Id}, owner: ${human2.address})`);
  console.log(`    Total agents: ${await registry.totalAgents()}\n`);

  // --- Set metadata ---
  console.log("▸ Phase 3: Store on-chain metadata\n");

  await registry.connect(human1).setMetadata(agent1Id, "model", ethers.toUtf8Bytes("gpt-4o"));
  await registry.connect(human1).setMetadata(agent1Id, "harness", ethers.toUtf8Bytes("cursor"));
  await registry.connect(human2).setMetadata(agent2Id, "model", ethers.toUtf8Bytes("claude-4.6-opus"));

  const model1 = ethers.toUtf8String(await registry.getMetadata(agent1Id, "model"));
  const model2 = ethers.toUtf8String(await registry.getMetadata(agent2Id, "model"));
  console.log(`  DataProvider model: ${model1}`);
  console.log(`  Analyst model: ${model2}\n`);

  // --- Create commitment ---
  console.log("▸ Phase 4: Agent-to-agent commitment (cooperation)\n");

  const deadline = (await ethers.provider.getBlock("latest")).timestamp + 7200;
  const stake = ethers.parseEther("0.5");

  await commitment.connect(human1).propose(
    agent1Id, agent2Id,
    "DataProvider delivers cleaned market dataset (>10k rows, last 30 days). Analyst produces summary report within 2 hours.",
    deadline,
    { value: stake }
  );
  console.log(`  ✓ Commitment proposed (stake: ${ethers.formatEther(stake)} ETH)`);
  console.log(`    Terms: "DataProvider delivers dataset, Analyst produces report"`);
  console.log(`    Deadline: ${new Date(deadline * 1000).toISOString()}\n`);

  await commitment.connect(human2).accept(0, { value: stake });
  console.log(`  ✓ Commitment accepted by Analyst-Agent (matched stake: ${ethers.formatEther(stake)} ETH)`);
  console.log(`    Total locked: ${ethers.formatEther(stake * 2n)} ETH\n`);

  // --- Fulfill commitment ---
  console.log("▸ Phase 5: Fulfill with on-chain evidence\n");

  const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({
    datasetRows: 12847,
    dateRange: "2026-02-13 to 2026-03-13",
    reportPages: 8,
    completedAt: "2026-03-13T14:30:00Z"
  })));

  const bal1Before = await ethers.provider.getBalance(human1.address);
  const bal2Before = await ethers.provider.getBalance(human2.address);

  await commitment.connect(human1).fulfill(0, "ipfs://QmEvidence123", evidenceHash);

  const bal1After = await ethers.provider.getBalance(human1.address);
  const bal2After = await ethers.provider.getBalance(human2.address);

  console.log(`  ✓ Commitment fulfilled with evidence`);
  console.log(`    Evidence URI: ipfs://QmEvidence123`);
  console.log(`    Evidence hash: ${evidenceHash.slice(0, 18)}...`);
  console.log(`    Stakes returned to both parties\n`);

  // --- Give feedback ---
  console.log("▸ Phase 6: Reputation feedback (ERC-8004 Reputation Registry)\n");

  await reputation.connect(human2).giveFeedback(
    agent1Id, 92, 0, "starred", "data-quality",
    "https://mcp.dataprovider.example/",
    "ipfs://QmFeedback1", ethers.ZeroHash
  );
  console.log(`  ✓ Analyst gave DataProvider 92/100 (tag: starred, data-quality)`);

  await reputation.connect(human1).giveFeedback(
    agent2Id, 88, 0, "starred", "report-quality",
    "", "ipfs://QmFeedback2", ethers.ZeroHash
  );
  console.log(`  ✓ DataProvider gave Analyst 88/100 (tag: starred, report-quality)`);

  // Third-party auditor feedback
  const tx3 = await registry.connect(auditor)["register(string)"]("data:application/json;base64," +
    Buffer.from(JSON.stringify({
      type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
      name: "Auditor-Agent",
      description: "Independent auditor agent",
      active: true
    })).toString("base64")
  );
  await tx3.wait();

  await reputation.connect(auditor).giveFeedback(
    agent1Id, 95, 0, "uptime", "",
    "", "", ethers.ZeroHash
  );
  console.log(`  ✓ Auditor gave DataProvider 95/100 (tag: uptime)`);

  // --- Append response ---
  await reputation.connect(human1).appendResponse(
    agent1Id, human2.address, 1,
    "ipfs://QmThankYouResponse", ethers.ZeroHash
  );
  console.log(`  ✓ DataProvider appended response to Analyst's feedback\n`);

  // --- Query reputation ---
  console.log("▸ Phase 7: Query on-chain reputation\n");

  const clients1 = [...await reputation.getClients(agent1Id)];
  const [count1, avg1] = await reputation.getSummary(agent1Id, clients1, "starred", "");
  console.log(`  DataProvider reputation:`);
  console.log(`    Feedback count (starred): ${count1}`);
  console.log(`    Average score: ${avg1}/100`);
  console.log(`    Total clients: ${clients1.length}`);

  const [count2, avg2] = await reputation.getSummary(agent2Id, [human1.address], "", "");
  console.log(`  Analyst reputation:`);
  console.log(`    Feedback count: ${count2}`);
  console.log(`    Average score: ${avg2}/100\n`);

  // --- Final state ---
  console.log("▸ Phase 8: Final state\n");

  const c = await commitment.getCommitment(0);
  const statusNames = ["Proposed", "Accepted", "Fulfilled", "Disputed", "Resolved", "Expired"];
  console.log(`  Commitment #0: ${statusNames[Number(c.status)]}`);
  console.log(`  Total agents registered: ${await registry.totalAgents()}`);
  console.log(`  Total commitments: ${await commitment.getCommitmentCount()}\n`);

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  Demo complete — full agent trust lifecycle shown    ║");
  console.log("║  Identity → Metadata → Commitment → Fulfillment     ║");
  console.log("║  → Evidence → Reputation → On-chain audit trail     ║");
  console.log("╚══════════════════════════════════════════════════════╝");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
