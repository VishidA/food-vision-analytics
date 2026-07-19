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
    log_calories: Decimal
    log_protein: Decimal
    log_fat: Decimal
    log_carbs: Decimal

    model_config = ConfigDict(from_attributes=True)