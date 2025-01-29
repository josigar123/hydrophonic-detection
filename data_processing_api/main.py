from fastapi import FastAPI
from api.parameter_adjustment_api import router as parameter_router

app = FastAPI()

app.include_router(parameter_router, prefix="/api")