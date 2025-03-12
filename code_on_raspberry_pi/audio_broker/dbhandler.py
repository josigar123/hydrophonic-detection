from pymongo import MongoClient, GEOSPHERE
from datetime import datetime
import json

class MongoDBHandler:
    def __init__(self, connection_string, db_name="ais_database"):
        self.client = MongoClient(connection_string)
        self.db = self.client[db_name]
        self.ais_collection = self.db["ais_messages"]
        self.ship_collection = self.db["ships"]
        self.recordings_collection = self.db["recordings"]
        self.detections_collection = self.db["detections"]


        self.ais_collection.create_index([("location", GEOSPHERE)])
        self.ship_collection.create_index("mmsi", unique=True)
        self.recordings_collection.create_index("recording_id", unique=True)
        self.detections_collection.create_index("detection_id", unique=True)

    def store_ais_data(self, data):
        try:
            data["server_timestamp"] = datetime.now()

            if "latitude" in data and "longitude" in data:
                data["location"] = {
                    "type": "Point",
                    "coordinates": [data["longitude"], data["latitude"]]
                }
            result = self.ais_collection.insert_one(data)
            self.update_ship_info(data)

            return result.inserted_id
        except Exception as e:
            print(f"Error storing AIS data: {e}")
            return None
        
    def update_ship_info(self, data):
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
            self.ship_collection.update_one({"mmsi": mmsi}, update_data, upsert=True)

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
            self.ship_collection.update_one({"mmsi": mmsi}, update_data, upsert=True)
            

    def store_recordings(self, data):
        try:
            data["server_timestamp"] = datetime.now()

            result = self.recordings_collection.insert_one(data)

            return result.inserted_id
        except Exception as e:
            print(f"Error storing Recording data: {e}")
            return None
        
    def get_recordings(self, recording_id):
        try:
            return self.recordings_collection.find_one({"recording_id": recording_id})
        except Exception as e:
            print(f"Error retrieving recording: {e}")
            return None
        
    def find_ais_logs_in_timerange_and_area(self, start_time, end_time, location, max_distance_meters=1000):
        try:
            return list(self.ais_collection.find({
                "timestamp": {
                    "$gte": start_time,
                    "$lte": end_time
                },
                "location": {
                    "$nearSphere": {
                    "$geometry": location,
                    "$maxDistance": max_distance_meters
                    }
                }
            }))
        except Exception as e:
            print(f"Error finding AIS logs in timerange and area: {e}")
            return []
        
    def update_detection_potential_source(self, detection_id, potential_sources):
        try:
            return self.detections_collection.update_one(
                {"detection_id": detection_id},
                {"$set": {"potential_sources": potential_sources}}
            )
        except Exception as e:
            print(f"Error updating detection potential sources: {e}")
            return None
        

    def store_detections(self, data):
        try:
            data["server_timestamp"] = datetime.now()

            result = self.detections_collection.insert_one(data)

            return result.inserted_id
        except Exception as e:
            print(f"Error storing Detection data: {e}")
            return None
        
    def get_detections(self, detection_id):
        try:
            return self.detections_collection.find_one({"detection_id": detection_id})
        except Exception as e:
            print(f"Error retrieving detection: {e}")
            return None
    
        

    def close(self):
        if self.client:
            self.client.close()