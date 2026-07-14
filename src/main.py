from fastapi import FastAPI
from contextlib import asynccontextmanager
import uvicorn
from db.database import engine
from db.models.base import Base
from db.seed_spoonacular import seed_database_from_spoonacular

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    await seed_database_from_spoonacular()
    yield
    

app = FastAPI(lifespan=lifespan)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8080, reload=True)