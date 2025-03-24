from pymongo import MongoClient, GEOSPHERE
from datetime import datetime
import uuid



class MongoDBHandler:
    def __init__(self, mongodb_config: dict):
        self.config = mongodb_config
        self.client = MongoClient(mongodb_config["connection_string"])
        self.db = self.client[mongodb_config["database"]]

        self.collections = {
            "ais_logs": self.db[mongodb_config["collections"]["ais_logs"]],
            "ships": self.db[mongodb_config["collections"]["ships"]],
            "recordings": self.db[mongodb_config["collections"]["recordings"]],
            "detections": self.db[mongodb_config["collections"]["detections"]]
        }

        self.setup_indexes()

    def setup_indexes(self):
        self.collections["ships"].create_index("mmsi", unique=True)
        self.collections["ships"].create_index("last_seen")

        self.collections["ais_logs"].create_index("log_id", unique=True)
        self.collections["ais_logs"].create_index("mmsi")
        self.collections["ais_logs"].create_index("timestamp")
        self.collections["ais_logs"].create_index(["location", GEOSPHERE], sparse=True)

        self.collections["recordings"].create_index("recording_id", unique=True)
        self.collections["recordings"].create_index("start_time")
        self.collections["recordings"].create_index("end_time")
        self.collections["recordings"].create_index("detection_id")

        self.collections["detections"].create_index("detection_id", unique=True)
        self.collections["detections"].create_index("recording_id")
        self.collections["detections"].create_index("timestamp")
        self.collections["detections"].create_index("type")
        self.collections["detections"].create_index("ais_logs")
        

    def store_ais_data(self, data_list):
        if not data_list:
            return []
        
        if not isinstance(data_list, list):
            data_list = [data_list]

        inserted_ids = []
        for data in data_list:
            try:
                data["server_timestamp"] = datetime.now()
                data["log_id"] = str(uuid.uuid4())

                if "latitude" in data and "longitude" in data:
                    data["location"] = {
                        "type": "Point",
                        "coordinates": [data["longitude"], data["latitude"]]
                    }
                result = self.collections["ais_logs"].insert_one(data)
                self.update_ships_info(data)

                inserted_ids.append(data["log_id"])
            except Exception as e: 
                print(f"Error storing AIS data: {e}")

        return inserted_ids
    
    def store_recordings(self, data):
        if "recording_id" not in data:
            return
        try:
            data["server_timestamp"] = datetime.now()

            result = self.collections["recordings"].insert_one(data)

            return result.inserted_id
        except Exception as e:
            print(f"Error storing Recording data: {e}")
            return None
        
    def store_detections(self, data):
        if "detection_id" not in data:
            return
        if "recording_id" not in data:
            return
        try:
            data["server_timestamp"] = datetime.now()

            result = self.collections["detections"].insert_one(data)

            return result.inserted_id
        except Exception as e:
            print(f"Error storing Detection data: {e}")
            return None


    def update_ships_info(self, data):
        if "mmsi" not in data:
            return
        mmsi = data["mmsi"]
        msg_type = data.get("message_type")

        if msg_type in [1,2,3,18,19] and "location" in data:
            update_data = {
                "$set": {
                    "last_position": data["location"],
                    "last_seen": data["server_timestamp"],
                    "course": data.get("course"),
                    "speed": data.get("speed"),
                    "heading": data.get("heading")
                }
            }
            self.collections["ships"].update_one({"mmsi": mmsi}, update_data, upsert=True)

        elif msg_type == 5 :
            update_data = {
                "$set": {
                    "name": data.get("name"),
                    "mmsi": data.get("mmsi"),
                    "callsign": data.get("callsign"),
                    "ship_type": data.get("ship_type"),
                    "destination": data.get("destination"),
                    "last_updated": data["server_timestamp"]
                }
            }
            self.collections["ships"].update_one({"mmsi": mmsi}, update_data, upsert=True)

    
    def get_recordings(self, recording_id):
        try:
            return self.collections["recordings"].find_one({"recording_id": recording_id})
        except Exception as e:
            print(f"Error retrieving recording: {e}")
            return None
        
        
    def get_detections(self, detection_id):
        try:
            return self.collections["detections"].find_one({"detection_id": detection_id})
        except Exception as e:
            print(f"Error retrieving detection: {e}")
            return None
        
    def get_ais_log_id_in_timerange(self, start_time, end_time):
        try:
            docs = list(self.collections["ais_logs"].find({
                "timestamp": {
                    "$gte": start_time,
                    "$lte": end_time
                }
            }, {f"log_id": 1,"_id": 0 }
            ))
            return [doc.get("log_id") for doc in docs if doc.get("log_id")]
        except Exception as e:
            print(f"Error finding AIS logs in timerange {e}")
            return []
            
        
    def get_detections_for_recording(self, recording_id):
        return list(self.collections["detections"].find({"recording_id": recording_id}))
    
    def get_recordings_by_mmsi(self, mmsi, start_time=None, end_time=None):

        query = {"mmsi": mmsi}
        if start_time or end_time:
            query["timestamp"] = {}
            if start_time:
                query["timestamp"]["$gte"] = start_time
            if end_time:
                query["timestamp"]["$lte"] = end_time
    
        log_ids = list(self.collections["ais_logs"].find(query).distinct("log_id"))
        recordings = list(self.collections["recordings"].find({"ais_log_ids": {"$in": log_ids}}))
        
        for recording in recordings:
            recording["detections"] = self.get_detections_for_recording(recording["recording_id"])
        
        return recordings

    def close(self):
        if self.client:
            self.client.close()

