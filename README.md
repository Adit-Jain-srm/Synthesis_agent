# AgentTrust

**On-chain trust infrastructure for autonomous AI agents, built on ERC-8004.**

AgentTrust gives AI agents the ability to establish verifiable identity, build composable reputation, make enforceable commitments, and request independent validation — all on Ethereum (Base).

No centralized registries. No platform lock-in. No trust assumptions beyond the chain itself.

---

## The Problem

AI agents are starting to interact, transact, and make deals autonomously. But the infrastructure they run on was built for humans:

- **Identity** — Agents have no portable, censorship-resistant way to prove who they are across platforms.
- **Reputation** — There's no shared, verifiable record of an agent's past performance that lives outside a single platform's database.
- **Commitments** — When agents make deals, enforcement depends on whoever runs the platform. If they change the rules, your deal changes too.
- **Validation** — No standard way for third parties to independently verify that an agent's work is correct.

## The Solution

AgentTrust implements the full [ERC-8004 (Trustless Agents)](https://eips.ethereum.org/EIPS/eip-8004) specification plus a Commitment Engine for enforceable agent cooperation:

| Contract | ERC-8004 Component | Purpose |
|---|---|---|
| `AgentRegistry` | Identity Registry | ERC-721 NFT-based agent identity with metadata and wallet management |
| `ReputationManager` | Reputation Registry | Structured feedback with tags, revocation, and aggregated summaries |
| `ValidationRegistry` | Validation Registry | Independent third-party verification with progressive validation |
| `CommitmentEngine` | *(extension)* | Enforceable agent-to-agent agreements with ETH staking |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      AgentTrust Protocol                      │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│   Identity   │  Reputation  │  Validation  │   Commitment    │
│  (ERC-721)   │  (Feedback)  │  (Verify)    │   (Cooperate)   │
├──────────────┼──────────────┼──────────────┼─────────────────┤
│ • register() │ • giveFeed-  │ • validation │ • propose()     │
│ • setAgent   │   back()     │   Request()  │ • accept()      │
│   URI()      │ • revoke     │ • validation │ • fulfill()     │
│ • setMeta    │   Feedback() │   Response() │ • dispute()     │
│   data()     │ • getSumma-  │ • getSumma-  │ • claimExpired  │
│ • setAgent   │   ry()       │   ry()       │   ()            │
│   Wallet()   │ • appendRe-  │              │                 │
│              │   sponse()   │              │                 │
└──────────────┴──────────────┴──────────────┴─────────────────┘
                              │
                    Base (Ethereum L2)
```

### How It Works

1. **Register** — A human mints an ERC-721 NFT for their agent, with a URI pointing to the agent's registration file (capabilities, endpoints, supported trust models).

2. **Discover** — Other agents find registered agents on-chain. The registration file advertises MCP endpoints, A2A agent cards, wallets, and more.

3. **Commit** — Two agents create an on-chain agreement with terms, a deadline, and ETH stakes. Both parties lock value. The contract enforces outcomes.

4. **Fulfill** — The delivering agent submits evidence (URI + hash for integrity). Stakes are returned to both parties.

5. **Rate** — Agents give each other structured feedback (0-100 scores with tags like `starred`, `uptime`, `data-quality`). Feedback is composable and filterable on-chain.

6. **Validate** — Agents request independent verification from validators. Validators respond with scored assessments. Supports progressive validation (soft finality → hard finality).

---

## ERC-8004 Alignment

AgentTrust implements all three registries defined in [EIP-8004](https://eips.ethereum.org/EIPS/eip-8004):

### Identity Registry (AgentRegistry.sol)
- ERC-721 with URIStorage — each agent is a transferable NFT
- `agentURI` resolves to registration file (IPFS, HTTPS, or base64 data URI)
- On-chain metadata via `setMetadata(agentId, key, value)` for arbitrary key-value pairs
- `agentWallet` management with auto-clear on transfer (security per spec)

### Reputation Registry (ReputationManager.sol)
- `giveFeedback()` with `int128 value`, `uint8 valueDecimals`, dual tags (`tag1`, `tag2`)
- Feedback indexed per client per agent (1-indexed)
- `revokeFeedback()` and `appendResponse()` per spec
- `getSummary()` for aggregated reputation across clients with tag filtering

### Validation Registry (ValidationRegistry.sol)
- `validationRequest()` — agent owner requests verification from a validator
- `validationResponse()` — validator responds with 0-100 score
- Progressive validation: multiple responses per request (soft/hard finality)
- `getSummary()` with validator and tag filtering

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+ (for agent tools)

### Install & Test

```bash
# Clone
git clone https://github.com/Adit-Jain-srm/Synthesis_agent.git
cd Synthesis_agent

# Install contract dependencies
cd contracts && npm install

# Run all tests (30/30)
npx hardhat test

# Run full lifecycle demo
npx hardhat run scripts/demo.mjs
```

### Demo Output

The demo runs a complete 9-phase agent trust lifecycle on a local Hardhat network:

1. Deploy all 4 contracts
2. Register two agents with ERC-8004 registration files
3. Store on-chain metadata (model, harness)
4. Create agent-to-agent commitment with ETH staking
5. Fulfill commitment with evidence URI and hash
6. Exchange reputation feedback with tags
7. Query aggregated on-chain reputation
8. Request and receive independent validation
9. Show final protocol state

### Deploy to Base Sepolia

```bash
# Set deployer key (or use the pre-generated one in .env)
echo "DEPLOYER_PRIVATE_KEY=0xYOUR_KEY" > .env

# Deploy all contracts + register agent on-chain + save deployment info
npx hardhat run scripts/deploy-and-register.mjs --network baseSepolia

# Or check balance first and get guided instructions if unfunded:
npx hardhat run scripts/fund-and-deploy.mjs --network baseSepolia
```

### Deployment Artifacts

After deployment, contract addresses and agent registration info are saved to `deployments/<network>.json`.

---

## Project Structure

```
Synthesis_agent/
├── agent.py                    # CLI agent for hackathon API interaction
├── config.json                 # Registration config (gitignored)
├── AGENTS.md                   # Agent operating instructions
├── contracts/
│   ├── src/
│   │   ├── AgentRegistry.sol       # ERC-8004 Identity Registry (ERC-721)
│   │   ├── ReputationManager.sol   # ERC-8004 Reputation Registry
│   │   ├── ValidationRegistry.sol  # ERC-8004 Validation Registry
│   │   └── CommitmentEngine.sol    # Agent cooperation with staking
│   ├── test/
│   │   ├── AgentTrust.test.mjs     # 23 tests for Registry/Reputation/Commitment
│   │   └── ValidationRegistry.test.mjs  # 7 tests for Validation
│   └── scripts/
│       ├── deploy.mjs              # Deployment script
│       └── demo.mjs                # Full lifecycle demo
├── tools/                      # Python agent tools
│   ├── api_client.py               # Synthesis API client
│   ├── create_project.py           # Project creation
│   ├── register.py                 # Agent registration
│   ├── submit_project.py           # Project submission
│   ├── skill_loader.py             # Skill file fetcher
│   └── track_selector.py           # Track discovery
├── memory/
│   └── conversation_log.md     # Human-agent collaboration log
└── tasks/
    ├── todo.md                 # Task tracking
    └── lessons.md              # Lessons learned
```

---

## Hackathon Context

**The Synthesis** — 14-day hackathon where AI agents and humans build together as equals.

- **Themes**: "Agents that trust" + "Agents that cooperate"
- **Tracks**: Agents With Receipts — ERC-8004 (Protocol Labs)
- **Agent**: AditSynthesisAgent (registered on-chain via ERC-8004 on Base Mainnet)
- **Human**: Adit Jain — student, AI agent experience, coding comfort 8/10
- **Stack**: Cursor + Claude 4.6 Opus, Hardhat, Solidity 0.8.28, OpenZeppelin v5, Python

### Human-Agent Collaboration

This entire project was built through human-agent collaboration. The conversation log in `memory/conversation_log.md` documents every decision, pivot, and technical choice made together. The agent:
- Designed the contract architecture
- Analyzed the ERC-8004 spec and aligned all contracts to it
- Wrote all Solidity code, tests, and demo scripts
- Managed the hackathon API interaction (registration, project creation)
- Made strategic decisions about which prize tracks to target

The human:
- Defined the problem statement and vision
- Set operating instructions and quality standards
- Reviewed and approved architectural decisions
- Handled authentication and account setup

---

## Tech Stack

| Component | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.28, OpenZeppelin v5.6.1 |
| Chain | Base (Ethereum L2), Cancun EVM |
| Testing | Hardhat, Chai, ethers.js v6 |
| Agent Tools | Python 3, requests |
| Identity Standard | ERC-8004 (Trustless Agents) |
| Token Standard | ERC-721 (NFT-based agent identity) |

---

## License

MIT
