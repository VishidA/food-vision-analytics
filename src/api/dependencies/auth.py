from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.database import get_async_session
from db.models import Users
from core.security import get_username_from_token, SECRET_KEY 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_async_session)
) -> Users:
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials (token is invalid or expired)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        username = get_username_from_token(token=token, secret_key=SECRET_KEY)
    except ValueError: 
        raise credentials_exception
    result = await db.execute(select(Users).where(Users.username == username))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user