from minio import Minio
from minio.commonconfig import Tags
import datetime
import os
import json

MINIO_CONFIG_FILE_RELATIVE_PATH = '../configs/minio_config.json'

def upload_file(file_path, session_id=None, detection_id=None):

    # Read config
    with open(MINIO_CONFIG_FILE_RELATIVE_PATH, "r") as file:
        minio_conf = json.load(file)
    
    client  = Minio(minio_conf["endpoint"],
                access_key=minio_conf["access_key"],
                secret_key=minio_conf["secret_key"],
                secure=False)
    
    tags = Tags.new_object_tags()
    tags["upload_time"] = datetime.datetime.now().isoformat()

    if session_id:
        tags["session_id"] = session_id

    if detection_id:
        tags["detection_id"] = detection_id
    

    
    file_name = os.path.basename(file_path)
    bucket_name = minio_conf["bucket"]
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

def get_objects():

    with open(MINIO_CONFIG_FILE_RELATIVE_PATH, "r") as file:
        minio_conf = json.load(file)

    client = Minio(
        minio_conf["endpoint"],
        access_key=minio_conf["access_key"],
        secret_key=minio_conf["secret_key"],
        secure=False
    )

    bucket_name = minio_conf["bucket"]

    objects = client.list_objects(bucket_name, recursive=True)

    object_list = []
    for obj in objects:
        object_list.append({
            "object_name": obj.object_name,
            "size": obj.size,
            "last_modified": obj.last_modified.isoformat() if obj.last_modified else None
        })

    # Sort newest first (based on ISO string or datetime if you keep it)
    object_list.sort(key=lambda x: x["last_modified"], reverse=True)

    return object_list

def get_object_from_audio_bucket(object_name: str):
    with open(MINIO_CONFIG_FILE_RELATIVE_PATH, "r") as file:
        minio_conf = json.load(file)
    
    client = Minio(
        minio_conf["endpoint"],
        access_key=minio_conf["access_key"],
        secret_key=minio_conf["secret_key"],
        secure=False
    )
    
    bucket_name = minio_conf["bucket"]
    
    return client.get_object(bucket_name, object_name)
        