from decimal import Decimal

from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_async_session
from api.services.upload_service import process_upload
from api.schemas.consumption_log import UploadResponse
from api.dependencies.auth import get_current_user
from db.models.users import Users

router = APIRouter()

@router.post("/upload", response_model=UploadResponse)
async def upload_photo(
    file: UploadFile = File(...),
    weight_grams: Decimal = Form(Decimal("100")),
    session: AsyncSession = Depends(get_async_session),
    current_user: Users = Depends(get_current_user), 
):

    result = await process_upload(
        file=file,
        weight_grams=weight_grams,
        user_id=current_user.id,
        session=session,
    )
    return result