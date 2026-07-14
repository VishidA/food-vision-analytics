import asyncio
import httpx
from sqlalchemy import func, select
from core.config import settings
from db.models.products import Products
from db.database import async_session_maker

SPOONACULAR_API_KEY = settings.SPOONACULAR_API_KEY
API_URL = "https://api.spoonacular.com/recipes/guessNutrition"

def load_classes_from_txt(filepath="./data/..."):
    with open(filepath, "r", encoding="utf-8") as file:
        return [line.strip() for line in file.readlines()]
    
FOOD_101_CLASSES = load_classes_from_txt()

async def seed_database_from_spoonacular():
    # 1. Відкриваємо асинхронну сесію через вашу фабрику
    async with async_session_maker() as session:
        existing_products = await session.scalar(select(func.count(Products.id)))
        
        if existing_products and existing_products > 0:
            print("База вже заповнена, пропускаю seed.")
            return

        print("Починаємо завантаження даних з API Spoonacular...")
        
        # 2. Відкриваємо асинхронний клієнт для HTTP-запитів
        async with httpx.AsyncClient() as client:
            for raw_class_name in FOOD_101_CLASSES:
                search_query = raw_class_name.replace("_", " ")
                print(f"Робимо запит для: {search_query}...")
                
                params = {
                    "title": search_query,
                    "apiKey": settings.SPOONACULAR_API_KEY
                }
                
                # 3. Чекаємо на відповідь від API (await)
                response = await client.get(API_URL, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if "status" in data and data["status"] == "failure":
                        print(f"  [-] API не знайшло даних для: {search_query}")
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
                    
                    # session.add() залишається без await, бо це локальна синхронна операція
                    session.add(new_product)
                    print(f"  [+] Додано: {raw_class_name}")
                    
                else:
                    print(f"  [x] Помилка сервера для {search_query}: {response.status_code}")
                    
        # 4. Коміт транзакції тепер вимагає await, оскільки це звернення до БД
        try:
            await session.commit()
            print("\nУспіх! Дані збережено до бази.")
        except Exception as e:
            await session.rollback()
            print(f"\nПомилка запису в БД: {e}")

if __name__ == "__main__":
    # Оскільки функція асинхронна, запускаємо її через asyncio.run()
    asyncio.run(seed_database_from_spoonacular())