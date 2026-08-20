from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

class UserBase(BaseModel):
    username: str = Field(..., min_length=3)
    name: str = Field(..., min_length=3)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: int
    register_date: datetime

    model_config = ConfigDict(from_attributes=True)
