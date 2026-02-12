import requests
import json

API_KEY = "391b4ce281c644338e9890cbd8047aad"

headers = {
    "X-Auth-Token": API_KEY
}

url = "https://api.football-data.org/v4/teams/756/matches"

response = requests.get(url, headers=headers)

if response.status_code == 200:
    data = response.json()

    with open("data/ireland_matches.json", "w") as f:
        json.dump(data["matches"], f, indent=4)

    print("✅ Matches updated successfully.")
else:
    print("Error:", response.status_code)
    print(response.json())
