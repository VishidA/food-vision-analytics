from decimal import Decimal

from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_async_session
from api.services.upload_service import process_upload
from api.schemas.consuption_log import ConsumptionLogResponse
# from api.dependencies.auth import get_current_user  # TODO: підключити, коли буде готовий auth

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/", response_model=ConsumptionLogResponse)
async def upload_photo(
    file: UploadFile = File(...),
    weight_grams: Decimal = Form(Decimal("100")),
    session: AsyncSession = Depends(get_async_session),
    # current_user: Users = Depends(get_current_user),  # TODO
):
    user_id = 1  # TODO: замінити на current_user.id, коли auth-залежність з'явиться

    result = await process_upload(
        file=file,
        weight_grams=weight_grams,
        user_id=user_id,
        session=session,
    )
    return result["consumption_log"]