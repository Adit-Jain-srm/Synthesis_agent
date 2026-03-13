import json
import requests

BASE_URL = "https://synthesis.devfolio.co"


def load_api_key():
    try:
        with open("config.json", "r") as f:
            config = json.load(f)
        return config.get("apiKey")
    except FileNotFoundError:
        return None


class SynthesisAPI:

    def __init__(self, api_key=None):
        self.api_key = api_key or load_api_key()

    def headers(self):
        headers = {
            "Content-Type": "application/json"
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _parse_response(self, response):
        try:
            return response.json()
        except requests.exceptions.JSONDecodeError:
            return {
                "error": f"HTTP {response.status_code}: {response.text[:200]}",
                "status_code": response.status_code
            }

    def register(self, payload):
        url = f"{BASE_URL}/register"
        response = requests.post(url, headers=self.headers(), json=payload)
        return self._parse_response(response)

    def create_project(self, payload):
        url = f"{BASE_URL}/projects"
        response = requests.post(url, headers=self.headers(), json=payload)
        return self._parse_response(response)

    def get_project(self, project_id):
        url = f"{BASE_URL}/projects/{project_id}"
        response = requests.get(url, headers=self.headers())
        return self._parse_response(response)

    def update_project(self, project_id, payload):
        url = f"{BASE_URL}/projects/{project_id}"
        response = requests.patch(url, headers=self.headers(), json=payload)
        return self._parse_response(response)

    def submit_project(self, project_id):
        url = f"{BASE_URL}/projects/{project_id}/submit"
        response = requests.post(url, headers=self.headers())
        return self._parse_response(response)

    def get_tracks(self):
        url = f"{BASE_URL}/tracks"
        response = requests.get(url, headers=self.headers())
        return self._parse_response(response)

    def get_team(self, team_id):
        url = f"{BASE_URL}/teams/{team_id}"
        response = requests.get(url, headers=self.headers())
        return self._parse_response(response)
