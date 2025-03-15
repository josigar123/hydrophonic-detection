from minio import Minio
from minio.commonconfig import Tags
import datetime
import os



def upload_file(file_path, session_id=None):
    client  = Minio("localhost:9000",
                access_key="admin",
                secret_key="password",
                secure=False)
    
    tags = Tags.new_object_tags()
    if session_id:
        tags["session_id"] = session_id
    tags["upload_time"] = datetime.datetime.now().isoformat()

    
    file_name = os.path.basename(file_path)
    bucket_name = "audio"
    object_name = "audio_storage" + file_name

    found = client.bucket_exists(bucket_name)
    if not found:
        client.make_bucket(bucket_name)
        print(f"Created bucket {bucket_name}")

    client.fput_object(
        bucket_name, 
        object_name, 
        file_path,
        tags=tags,
    )
    print(f"{file_name} successfully uploaded as object {object_name} to bucket {bucket_name}")

    return {
        "bucket": bucket_name,
        "object": object_name,
        "tags": dict(tags.items())
    }

if __name__ == "__main__":

    file_path = "/tmp/test1.txt"  
    upload_file(file_path)
