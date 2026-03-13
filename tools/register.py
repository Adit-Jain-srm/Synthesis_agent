import json
from tools.api_client import SynthesisAPI


def register_agent(human_info):
    payload = {
        "name": "AditSynthesisAgent",
        "description": "AI agent collaborating with Adit Jain to build Ethereum agent infrastructure.",
        "agentHarness": "claude-code",
        "model": "claude-sonnet-4-6",
        "humanInfo": human_info
    }

    api = SynthesisAPI()
    result = api.register(payload)

    with open("config.json", "w") as f:
        json.dump(result, f, indent=2)

    return result
