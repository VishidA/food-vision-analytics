import asyncio
import httpx
from pathlib import Path
from sqlalchemy import func, select
from core.config import settings
from db.models.products import Products
from db.database import async_session_maker

SPOONACULAR_API_KEY = settings.SPOONACULAR_API_KEY
API_URL = "https://api.spoonacular.com/recipes/guessNutrition"

	
def load_classes_from_txt(filepath: str | Path | None = None):
    if filepath is None:
        filepath = Path(__file__).resolve().parent / "data" / "classes.txt"

    with open(filepath, "r", encoding="utf-8") as file:
        return [line.strip() for line in file.readlines()]
    

async def seed_database_from_spoonacular():
    
    FOOD_101_CLASSES = load_classes_from_txt()

    async with async_session_maker() as session:
        existing_products = await session.scalar(select(func.count(Products.id)))

        if existing_products and existing_products > 0:
            print("The database is already populated, skipping seed.")
            return

        print("Starting to load data from the Spoonacular API...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for raw_class_name in FOOD_101_CLASSES:
                search_query = raw_class_name.replace("_", " ")
                print(f"Sending request for: {search_query}...")
                
                params = {
                    "title": search_query,
                    "apiKey": settings.SPOONACULAR_API_KEY
                }
                
                response = await client.get(API_URL, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if "status" in data and data["status"] == "failure":
                        print(f"  [-] The API did not find data for: {search_query}")
                        continue
                    
                    calories = data.get("calories", {}).get("value", 0.0)
                    protein = data.get("protein", {}).get("value", 0.0)
                    fat = data.get("fat", {}).get("value", 0.0)
                    carbs = data.get("carbs", {}).get("value", 0.0)
                    
                    new_product = Products(
                        name=raw_class_name,
                        calories_100g=calories,
                        protein_100g=protein,
                        fat_100g=fat,
                        carbs_100g=carbs
                    )
                    
                    session.add(new_product)
                    print(f"  [+] Added: {raw_class_name}")
                    
                else:
                    print(f"  [x] Server error for {search_query}: {response.status_code}")
                    
        try:
            await session.commit()
            print("\nSuccess! Data has been saved to the database.")
        except Exception as e:
            await session.rollback()
            print(f"\nDatabase write error: {e}")

if __name__ == "__main__":
    asyncio.run(seed_database_from_spoonacular())