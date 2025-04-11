from minio import Minio
from minio.commonconfig import Tags
import datetime
import os



def upload_file(file_path, session_id=None, detection_id=None):
    client  = Minio("localhost:9000",
                access_key="admin",
                secret_key="password",
                secure=False)
    
    tags = Tags.new_object_tags()
    tags["upload_time"] = datetime.datetime.now().isoformat()

    if session_id:
        tags["session_id"] = session_id

    if detection_id:
        tags["detection_id"] = detection_id
    

    
    file_name = os.path.basename(file_path)
    bucket_name = "audio"
    object_name = file_name

    if not client.bucket_exists(bucket_name):
        client.make_bucket(bucket_name)
        print(f"Created bucket {bucket_name}")

    client.fput_object(
        bucket_name, 
        object_name, 
        file_path,
        tags=tags,
    )

    return {
        "bucket": bucket_name,
        "object": object_name,
        "tags": dict(tags.items())
    }
