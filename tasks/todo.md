# AgentTrust — Hackathon Winning Plan

## Goal
Win "Agents With Receipts — ERC-8004" ($8k) and place in "Synthesis Open Track" ($14k).

## What judges evaluate (from rules)
1. Ship something that works — demos, prototypes, deployed contracts
2. Agent must be a real participant — meaningful contribution to design/code/coordination
3. Everything on-chain counts — more artifacts = stronger
4. Open source required — all code public by deadline
5. Document the process — human-agent collaboration in conversationLog

## What we have (completed)
- [x] Registration (on-chain ERC-8004 identity on Base Mainnet)
- [x] 4 Solidity contracts — full ERC-8004 coverage (Identity, Reputation, Validation) + CommitmentEngine
- [x] 30/30 tests passing
- [x] 9-phase demo script showing full lifecycle
- [x] Python agent scaffold with API tools
- [x] Public GitHub repo
- [x] Conversation log documenting collaboration

## What's needed to win

### Phase 1: Deploy on-chain (critical — "everything on-chain counts")
- [ ] Fund deployer wallet with Base Sepolia ETH (manual — faucets need captcha)
- [x] Deploy-and-register script ready and tested locally
- [x] Script registers agent on-chain with ERC-8004 registration file
- [x] Script stores on-chain metadata (model, harness, hackathon, human)
- [x] Script saves deployment artifacts to deployments/<network>.json
- [ ] Run: `npx hardhat run scripts/deploy-and-register.mjs --network baseSepolia`

### Phase 2: README & documentation (judges need to understand fast)
- [x] Write comprehensive README with architecture diagram
- [x] Document each contract's purpose and API
- [x] Add "How to run" section (tests, demo, deploy)
- [x] Include hackathon context and ERC-8004 alignment

### Phase 3: Create project on platform (when tracks open)
- [ ] Poll tracks API until available
- [ ] Create project with full description, repo URL, conversation log
- [ ] Select "Agents With Receipts — ERC-8004" + "Synthesis Open Track"

### Phase 4: Polish
- [ ] Verify contracts on BaseScan/Blockscout
- [ ] Add deployment addresses to README
- [ ] Final conversation log update
- [ ] Final push to GitHub

## Review
_To be filled after completion_
