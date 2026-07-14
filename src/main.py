from fastapi import FastAPI
import uvicorn
from db.database import engine
from db.models.base import Base

app = FastAPI()

@app.on_event("startup")
async def on_startup() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8080, reload=True)