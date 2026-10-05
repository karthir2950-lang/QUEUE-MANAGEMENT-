from unittest.mock import patch
from app.routers.auth import google_auth
from app.schemas.auth import GoogleAuthRequest
from app.database.connection import SessionLocal

req = GoogleAuthRequest(token="dummy")
db = SessionLocal()

with patch('app.routers.auth.id_token.verify_oauth2_token') as mock_verify:
    mock_verify.return_value = {
        'email': 'testgoogle@example.com',
        'name': 'Test Google',
        'sub': 'google_123'
    }
    try:
        res = google_auth(req, db)
        print("Success:", res)
    except Exception as e:
        print("Error:", repr(e))
