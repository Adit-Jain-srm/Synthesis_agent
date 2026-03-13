import json
from tools.api_client import SynthesisAPI


def update_project(project_id, updates):
    api = SynthesisAPI()
    return api.update_project(project_id, updates)


def submit_project(project_id=None):
    api = SynthesisAPI()

    if not project_id:
        with open("config.json", "r") as f:
            config = json.load(f)
        project_id = config.get("projectId")

    if not project_id:
        raise ValueError("No project ID found. Create a project first.")

    return api.submit_project(project_id)
