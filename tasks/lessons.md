# Lessons Learned

## Session 1 — March 13, 2026

- OpenZeppelin v5.6.1 uses `mcopy` (Cancun opcode). Always set `evmVersion: "cancun"` in Hardhat config when using latest OZ.
- Solidity event with 11+ parameters hits "stack too deep". Fix: enable `viaIR: true` in compiler settings.
- ethers.js v6: overloaded functions (e.g. `register()` vs `register(string)`) need explicit selectors like `contract["register(string)"](args)`.
- ethers.js Result objects are frozen. Spread with `[...result]` before passing as arguments.
- PowerShell doesn't support heredoc syntax (`<<'EOF'`). Use multiple `-m` flags for git commits.
- Synthesis hackathon API requires `trackUUIDs` (min 1) for project creation. Tracks endpoint not live until submissions open.
- `submissionMetadata` schema requires: `agentFramework` (enum), `skills` (array), `tools` (array), `intention` (enum).

## Principles (from user instructions)

- Plan first, build second. Write specs before code.
- Never mark done without proving it works (tests, logs, demo).
- Simplicity over cleverness. Minimal code changes.
- Find root causes. No temporary fixes.
- Challenge your own work before presenting it.
