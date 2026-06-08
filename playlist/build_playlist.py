import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

PLAYLIST_ID = os.environ["SPOTIFY_PLAYLIST_ID"]

ARTISTS = [
    ("Twpsyn",               "02yBquhX7ueKHmZrxfjlim"),
    ("Amy True",             "7oVEKfsDB4c8t7RMPfNyWv"),
    ("Samana",               "0gf5phmsYQSLhOvHfgazMz"),
    ("Beans on Toast",       "6fVeXD7D2RpFoR6bzNEDPo"),
    ("Roni Size",            "5UjqeSp9dX6Nrge7WdDukr"),
    ("Bonnie Medicine",      "2Z6yCCJNCe0KfixGqJncRi"),
    ("Tomos Newman",         "2B1Y51FScTXm9gG6c4nTJk"),
    ("Dan Bettridge",        "626PNFpj7VtxuYllBq7Ju1"),
    ("Sky Barkers",          "3LIG6kfiFeiLBgYn4PBW6u"),
    ("The League of Rebelz", "0hzcRkyNO09e1xzwy58EpI"),
    ("Goldie Lookin Chain",  "0pobPzcYFoVSprUnwY2Bio"),
    ("Dylan Fowler",         "0SfxBmOJtvAgYZCJbEPET2"),
    ("Queen Beezie",         "3JN0z89EyKXHabR9KCCevt"),
    ("Arron Kirwan",         "6o59Rm36G0Zbkb7MpWlyXk"),
    ("Timbali",              "3uhmYgpdouANfuan9nk0tq"),
    ("Excellent Birds",      "26D0xSr2eIef3ivt0yrfGK"),
    ("The Pavilion",         "1PynWVTuXMAva0dUKXtEUP"),
    ("Omega Nebula",         "2iWJJEfxmQK1CZeWqjh4Xn"),
    ("Cosmic Smiles",        "1fBAtXPNZIdhgiRagbEQbG"),
]

TRACKS_PER_ARTIST = 3

# Artists whose tracks don't surface reliably via search — use known track URIs instead
MANUAL_TRACKS = {
    "3uhmYgpdouANfuan9nk0tq": [  # Timbali
        ("How Di Place A Run - Dreadsquad Remix", "spotify:track:2ZJvQlVbfww7h9jb6Wairm"),
        ("How Di Place A Run",                    "spotify:track:7rUjtDN7avNBe0NQDHfmLM"),
        ("Whine It Like That",                    "spotify:track:67y5b0sor7nng9Knk2KS1g"),
    ],
}

sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    scope="playlist-modify-public playlist-modify-private",
    cache_path=os.path.join(os.path.dirname(__file__), ".spotify_cache"),
))

print(f"Logged in as: {sp.current_user()['display_name']}\n")

track_uris = []
playlist_snapshot = []  # for playlist/tracks.json

for name, artist_id in ARTISTS:
    if artist_id in MANUAL_TRACKS:
        entries = MANUAL_TRACKS[artist_id][:TRACKS_PER_ARTIST]
        for track_name, uri in entries:
            print(f"  {name}: {track_name}")
            track_uris.append(uri)
            playlist_snapshot.append({"artist": name, "track": track_name, "uri": uri})
        continue

    results = sp.search(q=f'artist:"{name}"', type="track", limit=10)
    all_tracks = results["tracks"]["items"]
    artist_tracks = [t for t in all_tracks if any(a["id"] == artist_id for a in t["artists"])]

    seen = set()
    unique = []
    for t in artist_tracks:
        key = t["name"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(t)

    top = unique[:TRACKS_PER_ARTIST]
    if top:
        for track in top:
            print(f"  {name}: {track['name']}")
            track_uris.append(track["uri"])
            playlist_snapshot.append({"artist": name, "track": track["name"], "uri": track["uri"]})
    else:
        print(f"  {name}: no tracks found")

import json, os
snapshot_path = os.path.join(os.path.dirname(__file__), "tracks.json")
with open(snapshot_path, "w") as f:
    json.dump(playlist_snapshot, f, indent=2)
print(f"\nSaved snapshot → playlist/tracks.json")

print(f"Replacing playlist tracks ({len(track_uris)} total)...")
sp.playlist_replace_items(PLAYLIST_ID, track_uris)
print(f"Done! https://open.spotify.com/playlist/{PLAYLIST_ID}")
