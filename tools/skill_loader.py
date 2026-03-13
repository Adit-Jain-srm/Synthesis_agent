import requests

SKILL_URL = "https://synthesis.devfolio.co/skill.md"


def load_skill():
    response = requests.get(SKILL_URL)
    if response.status_code != 200:
        raise Exception("Failed to load skill file")
    return response.text
