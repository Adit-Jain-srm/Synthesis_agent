import json
import requests

BASE_URL = "https://synthesis.devfolio.co"


def load_config():
    with open("config.json", "r") as f:
        return json.load(f)


def headers():
    config = load_config()
    return {
        "Authorization": f"Bearer {config['apiKey']}",
        "Content-Type": "application/json",
    }


def load_conversation_log():
    try:
        with open("memory/conversation_log.md", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return ""


def create_project():
    config = load_config()
    conversation_log = load_conversation_log()

    payload = {
        "teamUUID": config["teamId"],
        "name": "AgentTrust",
        "description": (
            "On-chain trust infrastructure for autonomous AI agents, built on ERC-8004. "
            "AgentTrust implements the complete ERC-8004 (Trustless Agents) specification "
            "— Identity Registry (ERC-721 NFT-based agent identity), Reputation Registry "
            "(structured feedback with tags, revocation, and aggregated summaries), and "
            "Validation Registry (independent third-party verification with progressive validation) "
            "— plus a Commitment Engine for enforceable agent-to-agent agreements with ETH staking. "
            "No centralized registries. No platform lock-in. No trust assumptions beyond the chain itself. "
            "Agents register as NFTs, build composable reputation through peer attestations, "
            "make binding commitments with deadlines and stakes, and request independent validation "
            "of their work. 30 tests passing, 4 Solidity contracts, full 9-phase lifecycle demo."
        ),
        "problemStatement": (
            "As AI agents begin to interact, transact, and coordinate autonomously, there is no "
            "reliable infrastructure to verify their identity, reputation, and commitments. "
            "Trust flows through centralized registries and API key providers — if a provider "
            "revokes access or shuts down, agents lose the ability to operate. Humans have no "
            "independent way to verify what their agent is interacting with, whether counterparties "
            "are trustworthy, or whether commitments will be honored. AgentTrust solves this by "
            "putting agent identity, reputation, validation, and commitments on-chain using the "
            "ERC-8004 standard, giving agents portable credentials tied to Ethereum that no "
            "platform can revoke."
        ),
        "repoURL": "https://github.com/Adit-Jain-srm/Synthesis_agent",
        "trackUUIDs": [
            "3bf41be958da497bbb69f1a150c76af9",
            "fdb76d08812b43f6a5f454744b66f590",
            "6f0e3d7dcadf4ef080d3f424963caff5",
        ],
        "conversationLog": conversation_log,
        "submissionMetadata": {
            "agentFramework": "other",
            "agentFrameworkOther": "Custom Python agent scaffold with Hardhat smart contract framework",
            "agentHarness": "cursor",
            "model": "claude-4.6-opus",
            "skills": [
                "smart-contract-development",
                "erc-8004-trustless-agents",
                "ethereum-web3-development",
            ],
            "tools": [
                "Hardhat",
                "OpenZeppelin",
                "ethers.js",
                "Solidity",
                "Python requests",
                "Base (Ethereum L2)",
            ],
            "helpfulResources": [
                "https://eips.ethereum.org/EIPS/eip-8004",
                "https://synthesis.devfolio.co/skill.md",
                "https://synthesis.devfolio.co/themes.md",
                "https://docs.openzeppelin.com/contracts/5.x/erc721",
                "https://hardhat.org/docs",
            ],
            "helpfulSkills": [
                {
                    "name": "erc-8004-trustless-agents",
                    "reason": "Reading the full ERC-8004 spec enabled us to align all three registries (Identity, Reputation, Validation) to the standard, making the project directly competitive for the Protocol Labs track",
                },
            ],
            "intention": "continuing",
            "intentionNotes": "Planning to deploy to Base mainnet and build a frontend for agent discovery and reputation browsing. The protocol is designed to be a public good for the agent ecosystem.",
        },
    }

    r = requests.post(f"{BASE_URL}/projects", headers=headers(), json=payload)
    result = r.json()
    print(f"Status: {r.status_code}")
    print(json.dumps(result, indent=2, default=str))

    if r.status_code in (200, 201) and result.get("uuid"):
        config["projectId"] = result["uuid"]
        with open("config.json", "w") as f:
            json.dump(config, f, indent=2)
        print(f"\nProject UUID saved: {result['uuid']}")

    return result


if __name__ == "__main__":
    create_project()
