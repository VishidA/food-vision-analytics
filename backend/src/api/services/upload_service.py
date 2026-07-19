from decimal import Decimal

from fastapi import UploadFile, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.db.models import Products, ConsumptionLog
from backend.src.ml.inference import classify_image

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}
MAX_FILE_SIZE_MB = 10


async def process_upload(
    file: UploadFile,
    weight_grams: Decimal,
    user_id: int,
    session: AsyncSession,
) -> dict:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are supported")

    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_FILE_SIZE_MB}MB limit")

    try:
        prediction = classify_image(image_bytes)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Classification service unavailable") from exc

    if prediction["low_confidence_warning"]:
        raise HTTPException(
            status_code=422,
            detail="Image does not look like a food product",
        )

    result = await session.execute(
        select(Products).where(Products.name == prediction["predicted_class"])
    )
    product = result.scalar_one_or_none()

    if product is None:
        raise HTTPException(
            status_code=422,
            detail=f"No nutrition data found for predicted class '{prediction['predicted_class']}'",
        )

    factor = weight_grams / Decimal("100")
    log_entry = ConsumptionLog(
        user_id=user_id,
        product_id=product.id,
        weight=weight_grams,
        log_calories=Decimal(product.calories_100g) * factor,
        log_protein=Decimal(product.protein_100g) * factor,
        log_fat=Decimal(product.fat_100g) * factor,
        log_carbs=Decimal(product.carbs_100g) * factor,
    )
    session.add(log_entry)
    await session.commit()
    await session.refresh(log_entry)

    return {
        "predicted_class": prediction["predicted_class"],
        "confidence": prediction["confidence"],
        "low_confidence_warning": prediction["low_confidence_warning"],
        "consumption_log": log_entry,
    }