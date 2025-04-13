from Database.minio_handler import get_objects, download_file_to_device
from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("/objects")
def list_objects():
    return JSONResponse(content=get_objects())

@router.get("/download")
def download_file(object_name: str, destination: str):
    return JSONResponse(content=download_file_to_device(object_name, destination))