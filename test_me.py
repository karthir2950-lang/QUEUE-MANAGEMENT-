import requests

login_url = "http://127.0.0.1:8000/api/auth/login"
payload = {"email": "admin@smartqueue.com", "password": "admin123"}
resp = requests.post(login_url, json=payload)
token = resp.json()["access_token"]

me_url = "http://127.0.0.1:8000/api/auth/me"
headers = {"Authorization": f"Bearer {token}"}
me_resp = requests.get(me_url, headers=headers)

print("Status:", me_resp.status_code)
print("Response:", me_resp.text)
