import json
import logging
import socket
import time
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import PyMongoError, ConnectionFailure

MONGODB_CONFIG_RELATIVE_PATH = '../configs/mongodb_config.json'
MONGODB_ATLAS_CONFIG_RELATIVE_PATH = '../configs/mongodb_atlas_config.json' # File does not exist as of now

class MongoDBSyncHandler:

    def __init__(self, local_config_file=MONGODB_CONFIG_RELATIVE_PATH, atlas_config_file=MONGODB_ATLAS_CONFIG_RELATIVE_PATH):
        
        with open(local_config_file, "r") as file:
            self.local_config = json.load(file)
    
        with open(atlas_config_file, "r") as file:
            self.atlas_config = json.load(file)
   
        self.local_client = None
        self.atlas_client = None
        self.local_db = None
        self.atlas_db = None

        self.collections_to_sync = [
            "ais_logs",
            "ships",
            "recordings",
            "detections"
        ]

        self.sync_status = {
            "last_sync_time" : None,
            "last_synced_recording_id": None
        }

    def connect_local(self):
        try:
            self.local_client = MongoClient(self.local_config["connection_string"])
            self.local_db = self.local_client[self.local_config["database"]]

            self.local_client.admin.command("ping")
            print(f"Connected to local MongoDB")
            return True
        except ConnectionFailure as e:
            print(f"Failed to connect to local MongoDB server: {e}")
            return False
        except Exception as e:
            print(f"Error connecting to local MongoDB server: {e}")
            return False
        
    def connect_atlas(self):
        try:
            if not self.atlas_config["connection_string"]:
                print(f"Atlas connection string not configured")
                return False
            self.atlas_client = MongoClient(
                self.atlas_config["connection_string"],
                serverSelectionTimeoutMS=5000
            )
            self.atlas_db = self.atlas_client[self.atlas_config["database"]]
            self.atlas_client.admin.command("ping")
            print(f"Connected to Atlas MongoDB")
            return True
        except ConnectionFailure as e:
            print(f"Failed to connect to Atlas MongoDB server: {e}")
            return False
        except Exception as e:
            print(f"Error connecting to Atlas MongoDB: {e}")
            return False
        
    def check_internet(self):
        try:
            socket.create_connection(("8.8.8.8", 53), timeout=3)
            return True
        except (socket.timeout, socket.error):
            return False
        
    def sync_collection(self, collection_name, query=None, batch_size=100):
        try:
            if self.local_db is None or self.atlas_db is None:
                print(f"Database connections not established")
                return False
            print(f"Syncing collection: {collection_name}")

            local_collection = self.local_db[collection_name]
            atlas_collection = self.atlas_db[collection_name]

            if query is None:
                query = {}

            total_docs = local_collection.count_documents(query)
            print(f"Found {total_docs} documents to sync in {collection_name}")

            if total_docs == 0:
                print(f"No documents to sync in {collection_name}")
                return True
            
            synced_count = 0

            for skip in range(0, total_docs, batch_size):
                cursor = local_collection.find(query).skip(skip).limit(batch_size)
                batch = list(cursor)

                if not batch:
                    break

                for doc in batch:
                    if "_id" in doc:
                        del doc["_id"]

                if batch:
                    result = atlas_collection.insert_many(batch)
                    synced_count += len(result.inserted_ids)
                    time.sleep(0.5)

            print(f"Successfully synced {synced_count} documents from {collection_name}")
            return True
        except PyMongoError as e:
            print(f"Error syncing collection {collection_name}: {e}")
            return False
        
    def sync_recording_session(self, recording_id):
        try:
            if not self.connect_local():
                return False
            
            if not self.check_internet():
                print(f"No internet connection available. Skipping synchronization.")
                return False
            
            if not self.connect_atlas():
                return False
            print(f"Starting sync for recording session: {recording_id}")

            recording_query = {"recording_id": recording_id}
            self.sync_collection("recordings", recording_query)

            detections_query = {"recording_id": recording_id}
            self.sync_collection("detections", detections_query)

            detections = list(self.local_db.detections.find(detections_query))
            ais_log_ids = []

            for detection in detections:
                if "associated_ais_logs" in detection and detection["associated_ais_logs"]:
                    ais_log_ids.extend(detection["associated_ais_logs"])

            if ais_log_ids:
                ais_logs_query = {"log_id": {"$in": ais_log_ids}}
                self.sync_collection("ais_logs", ais_logs_query)

                mmsi_list = self.local_db.ais_logs.distinct("mmsi", ais_logs_query)
                
                if mmsi_list:
                    ships_query = {"mmsi": {"$in": mmsi_list}}
                    self.sync_collection("ships", ships_query)

            self.sync_status["last_sync_time"] = datetime.now()
            self.sync_status["last_synced_recording_id"] = recording_id

            print(f"Sucessfully completed sync for recording session: {recording_id}")
            return True
        
        except Exception as e:
            print(f"Error during recording session sync: {e}")
            return False
        finally:
            self.close()

    def sync_all_collections(self): 
        try:
            if not self.connect_local():
                return False
            if not self.check_internet():
                print(f"No internet connection available. Skipping synchronization.")
                return False
            if not self.connect_atlas():
                return False
            
            print(f"Starting full synchronization for all collections")
            success = True

            for collection_name in self.collections_to_sync:
                if not self.sync_collection(collection_name):
                    success = False

            if success:
                self.sync_status["last_sync_time"] = datetime.now()
                print(f"Sucessfully completed full synchronization")
            else:
                print(f"Synchronization completed with some errors")

            return success
        except Exception as e:
            print(f"Error during full synchronzation: {e}")
            return False
        
        finally:
            self.close()

    def close(self):
        if self.local_client:
            self.local_client.close()
            self.local_client = None
            self.local_db = None

        if self.atlas_client:
            self.atlas_client.close()
            self.atlas_client = None
            self.atlas_db = None



if __name__ == "__main__":
    import sys
    
    sync_handler = MongoDBSyncHandler()
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--full":
            print("Starting full sync of all collections...")
            sync_handler.sync_all_collections()
        elif sys.argv[1] == "--recording" and len(sys.argv) > 2:
            recording_id = sys.argv[2]
            print(f"Starting sync for recording session: {recording_id}")
            sync_handler.sync_recording_session(recording_id)
        else:
            print("Usage: python mongodb_sync.py [--full | --recording <recording_id>]")
    else:
        print("Starting full sync of all collections (default)...")
        sync_handler.sync_all_collections()