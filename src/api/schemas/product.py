from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ProductBase(BaseModel):
    name: str
    calories_100g: float
    protein_100g: float
    fat_100g: float
    carbs_100g: float

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int 
    register_date: datetime  

    model_config = ConfigDict(from_attributes=True)