import requests
import json

url = "http://127.0.0.1:8000/api/auth/login"
payload = {
    "email": "admin@smartqueue.com",
    "password": "admin123"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload)
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", str(e))
