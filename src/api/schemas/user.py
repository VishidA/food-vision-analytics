from pydantic import BaseModel, ConfigDict
from datetime import datetime

class UserBase(BaseModel):
    login_name: str
    name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    register_date: datetime

    model_config = ConfigDict(from_attributes=True)
