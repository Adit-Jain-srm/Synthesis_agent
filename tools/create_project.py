import json
from tools.api_client import SynthesisAPI

REPO_URL = "https://github.com/Adit-Jain-srm/Synthesis_agent"

VALID_FRAMEWORKS = ["langchain", "elizaos", "mastra", "vercel-ai-sdk", "anthropic-agents-sdk", "other"]
VALID_INTENTIONS = ["continuing", "exploring", "one-time"]


def create_project(
    name,
    description,
    problem_statement,
    repo_url=None,
    track_uuids=None,
    conversation_log="",
    agent_framework="other",
    skills=None,
    tools=None,
    intention="continuing",
):
    api = SynthesisAPI()

    with open("config.json", "r") as f:
        config = json.load(f)

    if not conversation_log:
        try:
            with open("memory/conversation_log.md", "r") as f:
                conversation_log = f.read()
        except FileNotFoundError:
            conversation_log = ""

    payload = {
        "name": name,
        "description": description,
        "teamUUID": config["teamId"],
        "problemStatement": problem_statement,
        "repoURL": repo_url or REPO_URL,
        "trackUUIDs": track_uuids or [],
        "conversationLog": conversation_log,
        "submissionMetadata": {
            "agentHarness": "cursor",
            "model": "claude-4.6-opus",
            "agentFramework": agent_framework,
            "skills": skills or ["smart-contract-development", "on-chain-identity", "agent-trust-infrastructure"],
            "tools": tools or ["hardhat", "solidity", "python", "base-mainnet"],
            "intention": intention,
        },
    }

    result = api.create_project(payload)

    if result.get("success", True) and "error" not in result:
        config["projectId"] = result.get("projectId") or result.get("id") or result.get("uuid")
        with open("config.json", "w") as f:
            json.dump(config, f, indent=2)

    return result
