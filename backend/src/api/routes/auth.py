from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.src.db.database import get_async_session
from backend.src.db.models import Users
from backend.src.api.schemas.user import UserCreate, UserResponse
from backend.src.api.schemas.tokens import Token
from backend.src.core.security import get_password_hash, verify_password
from backend.src.api.services.jwt import create_access_token_for_user
from backend.src.core.security import SECRET_KEY

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate, db: AsyncSession = Depends(get_async_session)):
    result = await db.execute(select(Users).where(Users.username == user_data.username))
    if result.scalars().first():
        raise HTTPException(status_code=409, detail="Login already taken")

    new_user = Users(
        username=user_data.username,
        name=user_data.name,
        hash_password=get_password_hash(user_data.password)
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_async_session)):
    result = await db.execute(select(Users).where(Users.username == form_data.username))
    user = result.scalars().first()

    if not user or not verify_password(form_data.password, user.hash_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token_for_user(user=user, secret_key=SECRET_KEY)

    return {"access_token": access_token, "token_type": "bearer"}