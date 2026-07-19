from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.src.db.database import get_async_session
from backend.src.db.models import Users, ConsumptionLog, Products
from backend.src.api.schemas.consumption_log import ConsumptionLogResponse
from backend.src.api.dependencies.auth import get_current_user

router = APIRouter()

@router.get("/history", response_model=List[ConsumptionLogResponse])
async def get_consumption_history(
    skip: int = Query(0, description="Number of records to skip (for pagination)"),
    limit: int = Query(50, description="Maximum number of records to return"),
    session: AsyncSession = Depends(get_async_session),
    current_user: Users = Depends(get_current_user), 
):
    """
    Returns the consumption history for the currently authenticated user.
    """
    stmt = (
        select(ConsumptionLog, Products.name.label("product_name"))
        .join(Products, Products.id == ConsumptionLog.product_id)
        .where(ConsumptionLog.user_id == current_user.id)
        .order_by(ConsumptionLog.id.desc()) 
        .offset(skip)
        .limit(limit)
    )
    
    result = await session.execute(stmt)
    rows = result.all()

    return [
        ConsumptionLogResponse.model_validate(
            {
                **log.__dict__,
                "product_name": product_name,
            }
        )
        for log, product_name in rows
    ]