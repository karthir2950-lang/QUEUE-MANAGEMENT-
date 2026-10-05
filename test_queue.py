import requests
import json
import uuid
import datetime

BASE_URL = "http://127.0.0.1:8000"

def get_token(email, password):
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    if res.status_code == 200:
        return res.json()["access_token"]
    print(f"Login failed for {email}: {res.text}")
    return None
    return None

def run_tests():
    try:
        user_token = get_token("user1@example.com", "user123")
        staff_token = get_token("staff@smartqueue.com", "staff123")
        admin_token = get_token("admin@smartqueue.com", "admin123")

        headers_user = {"Authorization": f"Bearer {user_token}"}
        headers_staff = {"Authorization": f"Bearer {staff_token}"}
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        
        # Admin: get services and branches
        res = requests.get(f"{BASE_URL}/api/services", headers=headers_admin)
        services = res.json()
        if not services:
            print("No services available for testing.")
            return
        s = services[0]
        
        # User: Book 5 appointments
        for i in range(5):
            appt_data = {
                "service_id": s["id"],
                "branch_id": 1,
                "appointment_date": str(datetime.date.today() + datetime.timedelta(days=1)),
                "appointment_time": f"0{9+i}:00"
            }
            res = requests.post(f"{BASE_URL}/api/appointments", json=appt_data, headers=headers_user)
            print(f"Booked {i+1}:", res.status_code, res.json().get("booking_id"))
            
        # Get queues
        res = requests.get(f"{BASE_URL}/api/queue", headers=headers_staff)
        queues = res.json()
        print("Staff queues:", len(queues))
        if len(queues) == 0:
            print("No queues found for staff.")
            return
            
        waiting = [q for q in queues if q["queue_status"] == "WAITING"]
        if not waiting:
            print("No waiting queues")
            return
            
        first_q = waiting[0]
        
        # Staff Call Next
        res = requests.post(f"{BASE_URL}/api/queue/{first_q['id']}/next", headers=headers_staff)
        print("Call Next:", res.status_code, res.json())
        
        # Staff Start
        res = requests.put(f"{BASE_URL}/api/queue/{first_q['id']}/start", headers=headers_staff)
        print("Start:", res.status_code, res.json())
        
        # User checks details
        res = requests.get(f"{BASE_URL}/api/queue/{first_q['id']}", headers=headers_user)
        print("User queue details:", res.status_code, res.json())
        
        # Staff Complete
        res = requests.put(f"{BASE_URL}/api/queue/{first_q['id']}/complete", headers=headers_staff)
        print("Complete:", res.status_code, res.json())

    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    run_tests()
