from pydantic import BaseModel
from datetime import datetime

class JWTMeta(BaseModel):
    exp: datetime
    sub: str

class JWTUser(BaseModel):
    username: str

class Token(BaseModel):
    access_token: str
    token_type: str