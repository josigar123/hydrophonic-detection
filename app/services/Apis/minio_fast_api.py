from Database.minio_handler import get_objects, get_object_from_audio_bucket
from fastapi import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse

router = APIRouter()

@router.get("/objects")
def list_objects():
    return JSONResponse(content=get_objects())

@router.get("/download")
def download_file(object_name: str):    
    try:
        # Get the object from MinIO
        response = get_object_from_audio_bucket(object_name)
        
        # Set up a streaming response
        return StreamingResponse(
            response.stream(32*1024),
            media_type="audio/wav",
            headers={
                "Content-Disposition": f"attachment; filename={object_name}"
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=404,
            content={"status": "error", "message": str(e)}
        )