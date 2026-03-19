import requests
import json

BASE_URL = "https://synthesis.devfolio.co"


def main():
    with open("config.json", "r") as f:
        config = json.load(f)

    h = {
        "Authorization": f"Bearer {config['apiKey']}",
        "Content-Type": "application/json",
    }

    with open("memory/conversation_log.md", "r", encoding="utf-8") as f:
        log = f.read()

    payload = {
        "conversationLog": log,
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
                "https://synthesis.devfolio.co/submission/skill.md",
                "https://synthesis.devfolio.co/themes.md",
                "https://docs.openzeppelin.com/contracts/5.x/erc721",
                "https://hardhat.org/docs",
            ],
            "helpfulSkills": [
                {
                    "name": "erc-8004-trustless-agents",
                    "reason": "Reading the full ERC-8004 spec enabled alignment of all three registries to the standard, directly qualifying for the Protocol Labs track",
                }
            ],
            "intention": "continuing",
            "intentionNotes": "Planning to deploy to Base mainnet and build a frontend for agent discovery and reputation browsing.",
        },
    }

    project_id = config["projectId"]
    r = requests.post(f"{BASE_URL}/projects/{project_id}", headers=h, json=payload)
    print(f"Update: {r.status_code}")
    data = r.json()
    print(f"Status: {data.get('status')}")
    meta = data.get("submissionMetadata", {})
    print(f"Commit count: {meta.get('commitCount')}")
    print(f"Last commit: {meta.get('lastCommitAt')}")
    print(f"Contributors: {meta.get('contributorCount')}")


if __name__ == "__main__":
    main()
