from fastapi import FastAPI
from contextlib import asynccontextmanager
import uvicorn
from db.database import engine
from db.models import Base
from db.seed_csv import seed_database_from_csv

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    try:
        await seed_database_from_csv()    
    except Exception as exc:
        print(f"[seed] skipped due to error: {exc}")

        
    yield
    

app = FastAPI(lifespan=lifespan)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8080, reload=True)