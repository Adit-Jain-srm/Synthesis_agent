import sys
import json
from tools.skill_loader import load_skill
from tools.register import register_agent
from tools.create_project import create_project
from tools.submit_project import submit_project, update_project
from tools.track_selector import get_available_tracks
from tools.api_client import SynthesisAPI


def load_config():
    try:
        with open("config.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def log(message):
    """Append to conversation log."""
    with open("memory/conversation_log.md", "a") as f:
        f.write(f"\n{message}\n")


def cmd_status():
    """Show current agent status — registration, team, project."""
    config = load_config()

    if not config.get("apiKey"):
        print("NOT REGISTERED. Run: python agent.py register")
        return

    print("=== Agent Status ===")
    print(f"Name: {config.get('name', 'Unknown')}")
    print(f"Participant ID: {config.get('participantId')}")
    print(f"Team ID: {config.get('teamId')}")
    print(f"API Key: {config.get('apiKey', '')[:20]}...")
    print(f"Registration Tx: {config.get('registrationTxn')}")

    if config.get("projectId"):
        print(f"Project ID: {config.get('projectId')}")
        api = SynthesisAPI()
        project = api.get_project(config["projectId"])
        if "error" not in project:
            print(f"Project Name: {project.get('name', 'Unknown')}")
            print(f"Project Status: {project.get('status', 'Unknown')}")
    else:
        print("Project: None created yet")


def cmd_register():
    """Register with hardcoded human info (already collected)."""
    config = load_config()
    if config.get("apiKey"):
        print(f"Already registered as {config.get('name')}")
        print(f"API Key: {config.get('apiKey', '')[:20]}...")
        return config

    human_info = {
        "name": "Adit Jain",
        "email": "aditjain2005@gmail.com",
        "socialMediaHandle": "https://www.linkedin.com/in/-adit-jain",
        "background": "student",
        "cryptoExperience": "a little",
        "aiAgentExperience": "yes",
        "codingComfort": 8,
        "problemToSolve": (
            "As AI agents begin to interact, transact, and coordinate autonomously, "
            "there is no reliable infrastructure to verify their identity, reputation, "
            "and commitments. I want to build mechanisms that allow agents to establish "
            "trust, make enforceable agreements, and prove their actions on-chain so "
            "that autonomous collaboration between agents becomes reliable and auditable."
        ),
    }

    result = register_agent(human_info)
    print("Registration complete:")
    print(json.dumps(result, indent=2))
    log(f"**Agent:** Registered successfully. Participant ID: {result.get('participantId')}")
    return result


def cmd_skill():
    """Fetch and display the hackathon skill file."""
    skill = load_skill()
    print(skill)
    return skill


def cmd_tracks():
    """Fetch and display available tracks."""
    tracks = get_available_tracks()
    if isinstance(tracks, dict) and "error" in tracks:
        print(f"Tracks not available yet: {tracks['error']}")
    elif isinstance(tracks, list):
        for i, t in enumerate(tracks, 1):
            print(f"{i}. {t.get('name', 'Unknown')} — {t.get('description', '')[:80]}")
            print(f"   ID: {t.get('id', '')}")
    else:
        print(tracks)
    return tracks


def cmd_create_project(name, description, problem_statement, repo_url, track_uuids=None):
    """Create a hackathon project."""
    result = create_project(name, description, problem_statement, repo_url, track_uuids)
    print("Project created:")
    print(json.dumps(result, indent=2))
    if result.get("success", True) and "error" not in result:
        log(f"**Agent:** Created project '{name}' successfully.")
    else:
        log(f"**Agent:** Failed to create project '{name}': {result.get('error', 'unknown')}")
    return result


def cmd_update_project(updates):
    """Update an existing project."""
    config = load_config()
    project_id = config.get("projectId")
    if not project_id:
        print("ERROR: No project exists. Create one first.")
        return

    result = update_project(project_id, updates)
    print("Project updated:")
    print(json.dumps(result, indent=2))
    log(f"**Agent:** Updated project. Changes: {json.dumps(updates)}")
    return result


def cmd_submit():
    """Submit the project."""
    config = load_config()
    project_id = config.get("projectId")
    if not project_id:
        print("ERROR: No project exists. Create one first.")
        return

    result = submit_project(project_id)
    print("Submission result:")
    print(json.dumps(result, indent=2))
    log(f"**Agent:** Submitted project {project_id}. Result: {json.dumps(result)}")
    return result


def cmd_team():
    """Fetch team info."""
    config = load_config()
    team_id = config.get("teamId")
    if not team_id:
        print("ERROR: Not registered yet.")
        return

    api = SynthesisAPI()
    result = api.get_team(team_id)
    print("Team info:")
    print(json.dumps(result, indent=2))
    return result


COMMANDS = {
    "status": (cmd_status, "Show agent registration and project status"),
    "register": (cmd_register, "Register agent with the hackathon API"),
    "skill": (cmd_skill, "Fetch the hackathon skill file"),
    "tracks": (cmd_tracks, "List available hackathon tracks"),
    "create-project": (cmd_create_project, "Create a project: create-project <name> <description>"),
    "submit": (cmd_submit, "Submit the current project"),
    "team": (cmd_team, "Show team information"),
}


def main():
    if len(sys.argv) < 2:
        print("Synthesis Agent — Autonomous Hackathon Agent")
        print(f"\nUsage: python agent.py <command>\n")
        for cmd, (_, desc) in COMMANDS.items():
            print(f"  {cmd:20s} {desc}")
        return

    command = sys.argv[1]

    if command == "create-project":
        if len(sys.argv) < 5:
            print("Usage: python agent.py create-project <name> <description> <problem_statement> <repo_url> [track_uuids...]")
            return
        name = sys.argv[2]
        description = sys.argv[3]
        problem_statement = sys.argv[4]
        repo_url = sys.argv[5] if len(sys.argv) > 5 else ""
        track_uuids = sys.argv[6:] if len(sys.argv) > 6 else None
        cmd_create_project(name, description, problem_statement, repo_url, track_uuids)

    elif command in COMMANDS:
        COMMANDS[command][0]()

    else:
        print(f"Unknown command: {command}")
        print(f"Available: {', '.join(COMMANDS.keys())}")


if __name__ == "__main__":
    main()
