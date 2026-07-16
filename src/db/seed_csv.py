import csv
import os
from sqlalchemy import select
from db.database import async_session_maker
from db.models import Products

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE_PATH = os.path.join(CURRENT_DIR, "data", "products_export.csv")

async def seed_database_from_csv():
    if not os.path.exists(CSV_FILE_PATH):
        print(f"[-] File {CSV_FILE_PATH} not found. Skipping CSV import.")
        return

    async with async_session_maker() as session:
        result = await session.execute(select(Products.name))
        existing_products = set(result.scalars().all())

        products_to_add = []

        with open(CSV_FILE_PATH, mode='r', encoding='utf-8-sig') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                name = row.get("name")
                
                if not name or name in existing_products:
                    continue
                
                new_product = Products(
                    name=name,
                    calories_100g=float(row.get("calories_100g", 0.0)),
                    protein_100g=float(row.get("protein_100g", 0.0)),
                    fat_100g=float(row.get("fat_100g", 0.0)),
                    carbs_100g=float(row.get("carbs_100g", 0.0))
                )
                
                products_to_add.append(new_product)
                existing_products.add(name)

        if products_to_add:
            session.add_all(products_to_add)
            await session.commit()
            print(f"[+] Successfully added {len(products_to_add)} new products from CSV!")
        else:
            print("[~] No new products to add from CSV (all already exist in the database).")