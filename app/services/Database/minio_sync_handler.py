from minio import Minio
import boto3
import json

MINIO_CONFIG_RELATIVE_PATH = '../../configs/minio_config.json'
S3_FONCIG_RELATIVE_PATH = '../../configs/s3_config.json' # File does not exist as of now

class MinIOSyncHandler:
    def __init__(self, s3_config=S3_FONCIG_RELATIVE_PATH, minio_config=MINIO_CONFIG_RELATIVE_PATH ):
        with open(s3_config, "r") as file:
            s3_config = json.load(file)
            
        with open(minio_config, "r") as file:
            minio_config = json.load(file)
            
        self.s3_access_key = s3_config["access_key"]
        self.s3_secret_key = s3_config["secret_key"]
        self.s3_bucket_name = s3_config["bucket_name"]
        self.s3_endpoint = s3_config["endpoint"]

        self.minio_access_key = minio_config["access_key"]
        self.minio_secret_key = minio_config["secret_key"]
        self.minio_bucket_name = minio_config["bucket_name"]
        self.minio_endpoint = minio_config["endpoint"]

        self.minio_client = Minio(
            self.minio_endpoint,
            access_key=self.minio_access_key,
            secret_key=self.minio_secret_key,
            secure=False
        )

        s3_kwargs = {
            "aws_access_key_id": self.s3_access_key,
            "aws_secret_access_key": self.s3_secret_key,
        }

        if self.s3_endpoint:
            s3_kwargs["endpoint_url"] = self.s3_endpoint
        self.s3_client = boto3.client("s3", **s3_kwargs)

    def sync_session(self, session_id):
        source_bucket = self.minio_bucket_name
        target_bucket = self.s3_bucket_name

        try:
            objects = self.minio_client.list_objects(source_bucket)

            successful_objects = 0
            failed_objects = 0

            for obj in objects:
                try:
                    tags = self.minio_client.get_object_tags(source_bucket, obj.object_name)

                    if tags.get("session_id") == session_id:
                        response = self.minio_client.get_object(source_bucket, obj.object_name)
                        data = response.read()
                        response.close()

                        self.s3_client.put_object(
                            Bucket=target_bucket,
                            Key=obj.object_name,
                            Body=data
                        )
                        successful_objects += 1
                except Exception as e:
                    print(f"Error syncing object {obj.object_name}: {e}")
                    failed_objects += 1
            print(f"Session {session_id} sync complete: {successful_objects} successful, {failed_objects} failed")
            return successful_objects, failed_objects
        except Exception as e:
            print(f"Error syncing session {session_id}: {e}")
            raise


if __name__ == "__main__":
    sync_handler = MinIOSyncHandler()

    sync_handler.sync_session("session")