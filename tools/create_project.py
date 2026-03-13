import json
from tools.api_client import SynthesisAPI


def create_project(name, description, problem_statement, repo_url, track_uuids=None, conversation_log=""):
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
        "repoURL": repo_url,
        "trackUUIDs": track_uuids or [],
        "conversationLog": conversation_log,
        "submissionMetadata": {
            "agentHarness": "claude-code",
            "model": "claude-sonnet-4-6",
        },
    }

    result = api.create_project(payload)

    if result.get("success", True) and "error" not in result:
        config["projectId"] = result.get("projectId") or result.get("id") or result.get("uuid")
        with open("config.json", "w") as f:
            json.dump(config, f, indent=2)

    return result
