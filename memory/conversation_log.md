# Synthesis Build Log

## Day 1 — March 13, 2026

### Registration

**Human (Adit):** Set up the Synthesis Agent architecture. Provided registration details — student background, crypto experience (a little), AI agent experience (yes), coding comfort 8/10.

**Agent (AditSynthesisAgent):** Built the full agent scaffold and registered successfully with the Synthesis Hackathon API.

**Registration result:**
- participantId: `f70393e520254a6daaef3dbe98bd0f44`
- teamId: `7e7986a676764ef6ac4080736cbbfed3`
- On-chain identity (ERC-8004): [View on BaseScan](https://basescan.org/tx/0xe6240398d68ff890c33422d7d1bc2fb0cef997cccf6bac49cbb175c74896b8db)

### Problem Statement

**Human (Adit):** "As AI agents begin to interact, transact, and coordinate autonomously, there is no reliable infrastructure to verify their identity, reputation, and commitments. I want to build mechanisms that allow agents to establish trust, make enforceable agreements, and prove their actions on-chain so that autonomous collaboration between agents becomes reliable and auditable."

**Agent:** This aligns strongly with Theme 2 ("Agents that trust") and Theme 3 ("Agents that cooperate") from the hackathon brief. Key design spaces include:
- On-chain attestations and reputation
- Portable agent credentials (ERC-8004)
- Smart contract commitments
- Transparent dispute resolution

### Architecture Setup

**Agent:** Created autonomous agent with command-driven interface:
- `api_client.py` — Authenticated API client (auto-loads key from config.json)
- `skill_loader.py` — Fetches the hackathon skill file
- `register.py` — Agent registration tool
- `create_project.py` — Project creation with full API schema support
- `submit_project.py` — Project update and submission tool
- `track_selector.py` — Track discovery and selection tool

### ERC-8004 Deep Dive & Contract Upgrade

**Agent:** Read and analyzed the full ERC-8004 spec (Trustless Agents). The spec defines three registries:

1. **Identity Registry** — ERC-721 NFTs with URIs pointing to agent registration files, on-chain metadata key-value storage, and agent wallet management
2. **Reputation Registry** — Structured feedback system with int128 values, decimal precision, tags for filtering, off-chain evidence URIs, and feedback revocation
3. **Validation Registry** — Hooks for requesting/recording independent validator checks

**Decision:** Upgraded all three contracts to be ERC-8004 aligned. This directly targets the "Agents With Receipts — ERC-8004" prize track ($4k/$3k/$1k from Protocol Labs).

### Contract Upgrade — ERC-8004 Aligned

**Agent:** Rewrote all Solidity contracts:

**AgentRegistry (ERC-8004 Identity Registry):**
- Now extends ERC-721 with URIStorage — each agent is an NFT
- `register(string agentURI)` — mints NFT with URI to registration file
- `setAgentURI()` — update registration file pointer
- `setMetadata(agentId, key, value)` — arbitrary on-chain key-value metadata
- `setAgentWallet()` / `getAgentWallet()` — designated wallet for payments
- Agent wallet auto-clears on NFT transfer (security measure from ERC-8004)
- Solidity 0.8.28, Cancun EVM, OpenZeppelin v5.6.1

**ReputationManager (ERC-8004 Reputation Registry):**
- `giveFeedback(agentId, value, decimals, tag1, tag2, endpoint, feedbackURI, feedbackHash)` — structured feedback per ERC-8004 spec
- `revokeFeedback()` — clients can revoke their feedback
- `appendResponse()` — anyone can append responses (agent owners, auditors)
- `getSummary()` — aggregated reputation across multiple clients with tag filtering
- `readFeedback()` — read individual feedback entries
- Tracks feedback index per client (1-indexed, matching spec)

**CommitmentEngine (Agent Cooperation):**
- Now uses ERC-721 agentIds instead of raw addresses
- `propose(proposerAgentId, acceptorAgentId, terms, deadline)` with ETH staking
- `fulfill(commitmentId, evidenceURI, evidenceHash)` — evidence hash for integrity
- Stake returns use `getAgentWallet()` — respects ERC-8004 wallet designation
- `dispute()` and `claimExpired()` with proper agent ownership checks

**Test results:** 23/23 passing
- AgentRegistry: 11 tests (NFT minting, URI, metadata, wallet, transfer safety)
- ReputationManager: 7 tests (feedback, revocation, summary, responses)
- CommitmentEngine: 5 tests (propose, accept, fulfill, expire, dispute)

### Demo Script

**Agent:** Built comprehensive demo (`scripts/demo.mjs`) showing the full agent trust lifecycle:
1. Deploy all three contracts
2. Register two agents with full ERC-8004 registration files (base64 data URIs)
3. Store on-chain metadata (model, harness)
4. Create agent-to-agent commitment with 0.5 ETH stake each
5. Fulfill commitment with evidence URI and hash
6. Exchange reputation feedback with tags
7. Third-party auditor gives independent feedback
8. Query aggregated on-chain reputation
9. Show final state

Demo output confirms full lifecycle works end-to-end.

### Hackathon Strategy

**Agent:** Analyzed the full prize catalog (106 prizes across 3 pages):

**Primary targets:**
- "Agents With Receipts — ERC-8004" — $4,000/$3,000/$1,004 (Protocol Labs) — **strongest fit**
- "Synthesis Open Track" — $14,058.96 pool
- "Let the Agent Cook — No Humans Required" — $4,000/$2,500/$1,500 (Protocol Labs)

**Key hackathon rules:**
- Building: March 13 00:00 GMT → March 22 23:59 PST (9 days)
- Ship something that works (demos, prototypes, deployed contracts)
- Open source required
- Document human-agent collaboration in conversationLog
- More on-chain artifacts = stronger submission

### Project Creation — Blocked

**Agent:** The `POST /projects` endpoint requires at least 1 `trackUUID`, but the `/tracks` endpoint returns 404. The skill file says "Submissions will open soon." Will retry when tracks are published.

**Updated `create_project.py`** with correct API schema:
- `agentFramework` (required enum)
- `skills` and `tools` arrays (required)
- `intention` (required enum)

### Next Steps
- [ ] Deploy contracts to Base Sepolia when testnet ETH is available
- [ ] Create project on platform when tracks are published
- [ ] Build frontend demo showing agent trust workflows
- [ ] Verify contracts on BaseScan/Blockscout
- [ ] Consider adding ValidationRegistry (third ERC-8004 registry)
