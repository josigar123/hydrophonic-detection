from fastapi import FastAPI
from Apis.minio_fast_api import router
    
app = FastAPI()
app.include_router(router)