import requests
import json

'''

Simple test of kystverkets AIS api, code copied from: https://kystdatahuset.no/artikkel/api-tilgang

'''

def fetch_jwt():
    reqUrl = "https://kystdatahuset.no/ws/api/auth/login"

    headersList = {
    "accept": "*/*",
    "Content-Type": "application/json" 
    }

    payload = json.dumps({
    "username": "EMAIL@MAIL.com",
    "password": "PASSWORD"
    })

    response = requests.request("POST", reqUrl, data=payload,  headers=headersList)

    return response.json().get("data").get("JWT")

def test_post_endpoint(jwt):
    reqUrl = "https://kystdatahuset.no/ws/api/ais/positions/for-mmsis-time"

    headersList = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + jwt 
    }

    payload = json.dumps({
    "mmsiIds": [
        258500000
    ],
    "start": "201701011345",
    "end": "201701041345"
    })

    response = requests.request("POST", reqUrl, data=payload,  headers=headersList)

    print(response.text)

def main():

    jwt = fetch_jwt()
    test_post_endpoint(jwt)

main()