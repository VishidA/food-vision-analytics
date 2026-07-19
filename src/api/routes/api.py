from fastapi import APIRouter
from api.routes import upload, auth, history

router = APIRouter()
router.include_router(upload.router, tags=["Upload"], prefix="/consumption")
router.include_router(auth.router, tags=["Authentication"], prefix="/auth")
router.include_router(history.router, tags=["ConsumptionHistory"], prefix="/consumption")