from typing import Optional
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: str
    full_name: str
    email: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "operator"
    department: Optional[str] = "Revenue Department"
    designation: Optional[str] = "Staff"

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    department: Optional[str] = None
    designation: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True
