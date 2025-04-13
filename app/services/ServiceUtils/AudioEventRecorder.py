import json
import os
import wave
from datetime import datetime
import uuid
from datetime import timedelta
from Database.mongodb_handler import MongoDBHandler
from Database.minio_handler import upload_file

"""
This module handles audio event detection and recording.
It processes audio streams and detection signals from Kafka topics,
correlates them with AIS vessel data, and stores recordings in MinIO with
metadata in MongoDB.
"""

class AudioEventRecorder:
    def __init__(self, sample_rate, num_channels, bit_depth, chunk_size, mongodb_config):
        
        with open(mongodb_config, "r") as file:
            self.mongodb_config = json.load(file)

        self.db_handler = MongoDBHandler(self.mongodb_config["connection_string"])

        self.channels = num_channels
        self.sample_rate = sample_rate
        self.chunk_size = chunk_size
        self.bit_depth = bit_depth
        self.bytes_per_sample = self.bit_depth // 8

        self.debounce_seconds = 15.0
        self.buffer_size = 1000

        self.active_events = {}  
        self.ais_buffer = []
        self.current_session_id = str(uuid.uuid4())
        self.session_start_time = datetime.now()

        print(f"Started new recording session: {self.current_session_id}")
        print(f"Parameters: {self.channels} channels, {self.sample_rate} Hz, {self.chunk_size} chunk size")
        print(f"Debounce time: {self.debounce_seconds} seconds")


    
    def end_recording_session(self):
        if not self.current_session_id:
            print("No active session to end")
            return False
        
        session_end_time = datetime.now()
        session_duration = (session_end_time - self.session_start_time).total_seconds()

        recording_metadata = {
            "recording_id": self.current_session_id,
            "start_time": self.session_start_time,
            "end_time": session_end_time,
            "duration": session_duration,
            "sample_rate": self.sample_rate,
            "channels": self.channels,
            "bit_depth": self.bit_depth,
        }

        try:
            self.db_handler.store_recordings(recording_metadata)
            print(f"Session {self.current_session_id} ended and metadata stored")
            previous_session = self.current_session_id
            self.current_session_id = None
            return previous_session
        except  Exception as e: 
            print(f"Error ending session: {e}")
            return False

    def start_event_detection(self, event_id, event_metadata=None):
        if event_id in self.active_events:
            print(f"Event {event_id} already being recorded")
            return False
        
        self.active_events[event_id] = {
            "buffer": bytearray(),
            "start_time": datetime.now(),
            "metadata": event_metadata or {},
            "ais_start_index": len(self.ais_buffer),
        }
        return True
    
    def stop_event_detection(self, event_id):
        if event_id not in self.active_events:
            print(f"No active recording for event {event_id}")
            return False
        
        event_data = self.active_events.pop(event_id)

        if len(event_data["buffer"]) > 0:
            self.save_detection(event_id, event_data)
            return True
        else:
            print(f"No audio data collected for event {event_id}")
            return False
    
    def add_audio_chunk(self, chunk_data):
        for event_id, event_data in self.active_events.items():
            event_data['buffer'].extend(chunk_data)
        
    def add_ais_data(self, ais_data):
        if "timestamp" not in ais_data:
            ais_data["timestamp"] = datetime.now()
        
        ais_data["received_time"] = datetime.now()
        
        self.ais_buffer.append(ais_data)

        if len(self.ais_buffer) > self.buffer_size:
            self.ais_buffer = self.ais_buffer[-self.buffer_size:]
    
    def save_detection(self, event_id, event_data):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"/tmp/{event_id}_{timestamp}.wav"

        with wave.open(filename, "wb") as wav_file:
            wav_file.setnchannels(self.channels)
            wav_file.setsampwidth(self.bytes_per_sample)
            wav_file.setframerate(self.sample_rate)
            wav_file.writeframes(event_data["buffer"])
        
        print(f"WAV file created: {filename}")


        TIME_BUFFER = 15

        start_time = event_data["start_time"]
        end_time = datetime.now()
        buffer_start_time = start_time - timedelta(seconds=TIME_BUFFER)
        buffer_end_time = end_time + timedelta(seconds=TIME_BUFFER)

        duration = (end_time - start_time).total_seconds()
      
        relevant_ais_data = []
        for ais_entry in self.ais_buffer:
            try:
            
                entry_timestamp = self.parse_timestamp(ais_entry.get("timestamp"))
                if buffer_start_time <= entry_timestamp <= buffer_end_time:
                    entry_copy = ais_entry.copy()
                    relevant_ais_data.append(entry_copy)
                    
            except Exception as e:
                print(f"Error processing AIS entry timestamp: {e}")
                continue
        try:
            stored_ids = self.db_handler.store_ais_data(relevant_ais_data)
        except Exception as e:
            print(f"Error storing relevant AIS-data in MongoDB {e}")
            stored_ids = []

        try:
            storage_info = upload_file(filename, self.current_session_id, event_id)
        except Exception as e:
            print(f"Error uploading to MinIO: {e}")
            storage_info = {"error": str(e)}


        associated_ais_logs = stored_ids

        detection_metadata = {
            "detection_id": event_id,
            "start_time": start_time,
            "end_time": end_time,
            "duration": duration,
            "type": "type", 
            "hydrophone_id": "id",
            "filename": os.path.basename(filename),
            "file_size_bytes": len(event_data['buffer']) + 44,
            "storage_location": storage_info,
            "associated_ais_logs": associated_ais_logs,
            "num_ais_entries": len(relevant_ais_data),
            "recording_id": self.current_session_id,
            "ais_buffer_before_seconds": TIME_BUFFER,
        }

        detection_metadata.update(event_data["metadata"])

        try:
            self.db_handler.store_detections(detection_metadata)
        except Exception as e:
            print(f"Error storing metadata in MongoDB: {e}")

        try:
            os.remove(filename)
        except Exception as e:
            print(f"Error removing local file: {e}")

        return detection_metadata
    
    def parse_timestamp(self, timestamp_value):
        """
        Parse various timestamp formats into a datetime object.
        
        Parameters:
        timestamp_value: Can be a datetime object, string (ISO format), integer/float (unix timestamp),
                        or None (in which case the current time is returned)
        
        Returns:
        datetime: A properly formatted datetime object
        """
        if timestamp_value is None:
            return datetime.now()
            
        # If already a datetime object
        if isinstance(timestamp_value, datetime):
            return timestamp_value
            
        # If timestamp is a unix timestamp (int or float)
        if isinstance(timestamp_value, (int, float)):
            return datetime.fromtimestamp(timestamp_value)
            
        # If timestamp is an ISO format string
        if isinstance(timestamp_value, str):
            try:
                # Handle ISO format with Z (UTC) indicator
                return datetime.fromisoformat(timestamp_value.replace('Z', '+00:00'))
            except ValueError:
                # If string parsing fails, return current time
                return datetime.now()
                
        # Default fallback
        return datetime.now()
        
