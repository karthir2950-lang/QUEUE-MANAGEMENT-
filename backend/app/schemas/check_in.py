from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CheckInRequest(BaseModel):
    check_in_token: str

class CheckInResponse(BaseModel):
    message: str
    appointment_id: int
    booking_id: str
    token_number: str
    queue_status: str
    checked_in_at: datetime

class QRCodeResponse(BaseModel):
    token: str
    qr_data: str # Can be used directly to generate QR on frontend, or image bytes if needed. Usually just the token or a URI is enough. We'll return the token so frontend can generate the QR code.
    expires_at: Optional[datetime]
