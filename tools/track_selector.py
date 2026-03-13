from tools.api_client import SynthesisAPI


def get_available_tracks():
    api = SynthesisAPI()
    return api.get_tracks()


def display_tracks():
    tracks = get_available_tracks()

    if isinstance(tracks, dict) and "error" in tracks:
        print(f"Error fetching tracks: {tracks['error']}")
        return tracks

    print("\nAvailable Tracks:")
    print("-" * 40)

    if isinstance(tracks, list):
        for i, track in enumerate(tracks, 1):
            name = track.get("name", "Unknown")
            desc = track.get("description", "")
            track_id = track.get("id", "")
            print(f"{i}. {name}")
            if desc:
                print(f"   {desc[:100]}")
            print(f"   ID: {track_id}")
            print()
    else:
        print(tracks)

    return tracks
