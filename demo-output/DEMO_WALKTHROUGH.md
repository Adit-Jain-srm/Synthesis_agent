# AgentTrust — Full Demo Walkthrough

This document captures the complete output from running AgentTrust's test suite and 9-phase lifecycle demo. All output is from real execution against Hardhat's EVM, using the same contracts that would deploy to Base Sepolia/mainnet.

## Test Results — 30/30 Passing

```
  AgentTrust — ERC-8004 Aligned
    AgentRegistry (ERC-8004 Identity)
      ✓ mints ERC-721 NFT on registration
      ✓ stores agent URI (token URI)
      ✓ sets agent wallet to owner on registration
      ✓ allows owner to update agent URI
      ✓ rejects non-owner URI update
      ✓ supports on-chain metadata key-value storage
      ✓ blocks setting agentWallet via setMetadata
      ✓ allows owner to change agent wallet
      ✓ clears agent wallet on transfer
      ✓ registers without URI
      ✓ tracks total agents
    ReputationManager (ERC-8004 Reputation)
      ✓ accepts feedback from non-owner
      ✓ rejects self-review (owner reviewing own agent)
      ✓ tracks feedback index per client
      ✓ revokes feedback
      ✓ allows response appending
      ✓ computes summary across clients
      ✓ returns clients list
    CommitmentEngine (Agent Cooperation)
      ✓ creates and accepts a commitment using agentIds
      ✓ fulfills commitment with evidence hash
      ✓ handles expiry and returns stake to proposer wallet
      ✓ allows disputes
      ✓ rejects proposals from non-agent-owners
    ValidationRegistry (ERC-8004 Validation)
      ✓ creates a validation request
      ✓ rejects request from non-agent-owner
      ✓ allows validator to respond
      ✓ rejects response from non-validator
      ✓ allows multiple responses for progressive validation
      ✓ computes summary across validations
      ✓ tracks validator requests

  30 passing (2s)
```

## Deployment Output

```
=== AgentTrust Deploy & Register ===
Network: hardhat
Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Balance: 10000.0 ETH

▸ Deploying contracts...

  AgentRegistry:       0x5FbDB2315678afecb367f032d93F642f64180aa3
  ReputationManager:   0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
  CommitmentEngine:    0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
  ValidationRegistry:  0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

▸ Registering AditSynthesisAgent on-chain...

  Agent registered!
  agentId: 0
  NFT owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  Agent wallet: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  TX hash: 0x5b974072a060a96341fc07dda9aeb225fec2305ad3d1c12165f3874fdb4d1b46

▸ Setting on-chain metadata...

  model: claude-4.6-opus
  harness: cursor
  hackathon: synthesis-2026
  human: Adit Jain

  Deployment saved to: deployments/hardhat.json

=== Deployment Complete ===
```

## 9-Phase Lifecycle Demo

```
╔══════════════════════════════════════════════════════╗
║       AgentTrust — ERC-8004 Full Demo               ║
╚══════════════════════════════════════════════════════╝

▸ Phase 1: Deploy contracts

  AgentRegistry:       0x5FbDB2315678afecb367f032d93F642f64180aa3
  ReputationManager:   0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
  CommitmentEngine:    0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
  ValidationRegistry:  0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

▸ Phase 2: Register AI agents (ERC-8004 Identity)

  ✓ DataProvider-Agent registered (agentId: 0, owner: 0x7099...79C8)
    NFT owner: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
    Agent wallet: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  ✓ Analyst-Agent registered (agentId: 1, owner: 0x3C44...93BC)
    Total agents: 2

▸ Phase 3: Store on-chain metadata

  DataProvider model: gpt-4o
  Analyst model: claude-4.6-opus

▸ Phase 4: Agent-to-agent commitment (cooperation)

  ✓ Commitment proposed (stake: 0.5 ETH)
    Terms: "DataProvider delivers dataset, Analyst produces report"
    Deadline: 2026-03-19T10:47:15.000Z

  ✓ Commitment accepted by Analyst-Agent (matched stake: 0.5 ETH)
    Total locked: 1.0 ETH

▸ Phase 5: Fulfill with on-chain evidence

  ✓ Commitment fulfilled with evidence
    Evidence URI: ipfs://QmEvidence123
    Evidence hash: 0x7b0df2f0f26fe2f1...
    Stakes returned to both parties

▸ Phase 6: Reputation feedback (ERC-8004 Reputation Registry)

  ✓ Analyst gave DataProvider 92/100 (tag: starred, data-quality)
  ✓ DataProvider gave Analyst 88/100 (tag: starred, report-quality)
  ✓ Auditor gave DataProvider 95/100 (tag: uptime)
  ✓ DataProvider appended response to Analyst's feedback

▸ Phase 7: Query on-chain reputation

  DataProvider reputation:
    Feedback count (starred): 1
    Average score: 92/100
    Total clients: 2
  Analyst reputation:
    Feedback count: 1
    Average score: 88/100

▸ Phase 8: Independent validation (ERC-8004 Validation Registry)

  ✓ DataProvider requested validation from Auditor
    Request hash: 0x9f6aeee8f6e6c3e8...
  ✓ Auditor validated: 92/100 (tag: data-quality)
    Validator: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
    Score: 92/100, Tag: data-quality
    Agent validation summary: 1 validations, avg 92/100

▸ Phase 9: Final state

  Commitment #0: Fulfilled
  Total agents registered: 3
  Total commitments: 1

╔══════════════════════════════════════════════════════════╗
║  Demo complete — full ERC-8004 agent trust lifecycle    ║
║  Identity → Metadata → Commitment → Fulfillment        ║
║  → Evidence → Reputation → Validation → Audit trail    ║
╚══════════════════════════════════════════════════════════╝
```

## On-Chain Artifacts (Base Mainnet)

| Artifact | Transaction |
|---|---|
| ERC-8004 Agent Registration | [0xe624...](https://basescan.org/tx/0xe6240398d68ff890c33422d7d1bc2fb0cef997cccf6bac49cbb175c74896b8db) |
| Self-Custody Transfer | [0x0627...](https://basescan.org/tx/0x06279f2e307e631ae2997fdc4d32b376203f537b4bfac3daa8ada15096da6598) |

## How to Reproduce

```bash
git clone https://github.com/Adit-Jain-srm/Synthesis_agent.git
cd Synthesis_agent/contracts
npm install
npx hardhat test                          # 30/30 tests
npx hardhat run scripts/demo.mjs          # 9-phase lifecycle
npx hardhat run scripts/deploy-and-register.mjs  # deploy + register agent
```
