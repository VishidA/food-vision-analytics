from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from backend.src.db.database import engine
from backend.src.db.models import Base
from backend.src.db.seed_csv import seed_database_from_csv
from backend.src.api.routes.api import router

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
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|0\.0\.0\.0):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api/v1")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)