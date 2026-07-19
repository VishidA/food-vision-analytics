from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
from api.schemas.tokens import JWTUser
from pydantic import ValidationError
from core.config import settings

SECRET_KEY = settings.SECURITY_SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hash the plain password before storing it in the database."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify whether the provided password matches the stored hash."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    """Generate a JWT access token containing the provided data (typically includes the user ID)."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_username_from_token(token: str, secret_key: str) -> str:
    """Extract the `username` from the token after validating it."""
    try:
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
        return JWTUser(**payload).username
    except jwt.PyJWTError as decode_error:
        raise ValueError("unable to decode JWT token") from decode_error
    except ValidationError as validation_error:
        raise ValueError("malformed payload in token") from validation_error