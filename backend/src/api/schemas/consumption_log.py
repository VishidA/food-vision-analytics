from typing import Optional

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from decimal import Decimal

class ConsumptionLogBase(BaseModel):
    product_id: int
    weight: Decimal

class ConsumptionLogCreate(ConsumptionLogBase):
    user_id: int 

class ConsumptionLogResponse(ConsumptionLogBase):
    id: int
    user_id: int
    consumed_time: datetime
    product_name: Optional[str] = None
    log_calories: Decimal
    log_protein: Decimal
    log_fat: Decimal
    log_carbs: Decimal

    model_config = ConfigDict(from_attributes=True)


class UploadResponse(BaseModel):
    predicted_class: str
    confidence: float
    low_confidence_warning: bool
    consumption_log: ConsumptionLogResponse

    model_config = ConfigDict(from_attributes=True)