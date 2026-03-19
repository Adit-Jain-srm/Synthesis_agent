import requests
import json

def fetch_all_tracks():
    all_tracks = []
    for page in range(1, 10):
        r = requests.get(
            f"https://synthesis.devfolio.co/catalog?page={page}&limit=50"
        )
        data = r.json()
        items = data.get("items", [])
        if not items:
            break
        all_tracks.extend(items)
        if not data.get("pagination", {}).get("hasNextPage", False):
            break
    return all_tracks


if __name__ == "__main__":
    tracks = fetch_all_tracks()
    print(f"Total tracks: {len(tracks)}\n")
    for t in tracks:
        uuid = t["uuid"]
        name = t["name"]
        company = t.get("company", "")
        prizes = t.get("prizes", [])
        total = sum(float(p.get("amount", 0)) for p in prizes)
        safe_name = name.encode("ascii", "replace").decode()[:55]
        safe_company = company.encode("ascii", "replace").decode()
        print(f"  {uuid}  {safe_name:55s}  {safe_company:20s}  ${total:,.0f}")
