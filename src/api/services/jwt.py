import jwt
from datetime import datetime, timezone, timedelta
from api.schemas.tokens import JWTMeta, JWTUser
from typing import Dict, Any
from db.models.users import Users
from pydantic import ValidationError

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

def create_jwt_token(
    *, jwt_content: Dict[str, Any], secret_key: str, expires_delta: timedelta
) -> str:
    to_encode = jwt_content.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    
    meta_data = JWTMeta(
        exp=expire, 
        sub=to_encode.get("username", "unknown")
    ).model_dump()
    
    to_encode.update(meta_data)
    
    return jwt.encode(to_encode, secret_key, algorithm=ALGORITHM)


def create_access_token_for_user(user: Users, secret_key: str) -> str:
    return create_jwt_token(
        jwt_content=JWTUser(username=user.username).model_dump(),
        secret_key=secret_key,
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def get_username_from_token(token: str, secret_key: str) -> str:
    try:
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
        return JWTUser(**payload).username
    except jwt.PyJWTError as decode_error:
        raise ValueError("unable to decode JWT token") from decode_error
    except ValidationError as validation_error:
        raise ValueError("malformed payload in token") from validation_error