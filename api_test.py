import requests

'''

Simple test of the Barentswatch AIS api,
simply fetches an access token and hits a get endpoint

'''

client_id = "EMAIL:hydrophonic-detection"
client_secret = "PAVAROTTI"


def fetch_client(client_id, client_secret):
    url = "https://id.barentswatch.no/connect/token"

    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    data = {
        "client_id": client_id,
        "scope": "ais",
        "client_secret": client_secret,
        "grant_type": "client_credentials"
    }

    response = requests.post(url, headers=headers, data=data);
    access_token = response.json().get("access_token")
    return access_token

def get_ais_latest(access_token, date_time):
    url = "https://live.ais.barentswatch.no/v1/latest/ais"

    headers = {
        "Authorization": "Bearer " + access_token
    }

    response = requests.get(url, headers=headers)

    print("Status Code: ", response.status_code)
    print("Response JSON: ", response.json())

def main():
    date_time = "2025-01-14T14:30:00Z"
    access_token = fetch_client(client_id, client_secret)
    get_ais_latest(access_token, date_time)

if __name__ == "__main__":
    main()

