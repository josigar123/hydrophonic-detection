from minio import Minio
import os

def upload_file(file_path):
    client  = Minio("localhost:9000",
                access_key="lydfiler_hydrofon",
                secret_key="lydfiler_hydrofon123",
                secure=False)
    
    file_name = os.path.basename(file_path)
    bucket_name = "audio"
    object_name = "audio_storage" + file_path

    found = client.bucket_exists(bucket_name)
    if not found:
        client.make_bucket(bucket_name)
        print(f"Created bucket {bucket_name}")

    client.fput_object(
        bucket_name, 
        object_name, 
        file_path,
    )
    print(f"{file_name} successfully uploaded as object {object_name} to_bucket {bucket_name}")

    return {
        "bucket": bucket_name,
        "object": object_name
    }

if __name__ == "__main__":

    file_path = "/tmp/test1.txt"  
    upload_file(file_path)
