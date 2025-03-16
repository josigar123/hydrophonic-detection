import asyncio 
import json
import os
import wave
from datetime import datetime
import uuid
from aiokafka import AIOKafkaConsumer
from mongodb_handler import MongoDBHandler
from minio_handler import upload_file


class AudioEventRecorder:
    def __init__(self, config_file="recording_parameters.json", mongodb_config="mongodb_config.json"):
        with open(config_file, "r") as file:
            self.recording_params = json.load(file)
        
        with open(mongodb_config, "r") as file:
            self.mongodb_config = json.load(file)

        with open("broker_info.json", "r") as file:
            self.broker_info = json.load(file)

        self.db_handler = MongoDBHandler(self.mongodb_config["connection_string"])

        self.channels = self.recording_params["channels"]
        self.sample_rate = self.recording_params["sampleRate"]
        self.chunk_size = self.recording_params["recordingChunkSize"]
        self.bit_depth = 16  
        self.bytes_per_sample = self.bit_depth // 8

        self.active_events = {}  
        self.ais_buffer = []
        self.current_session_id = str(uuid.uuid4())
        self.session_start_time = datetime.now()

        print(f"Started new recording session: {self.current_session_id}")
        print(f"Parameters: {self.channels} channels, {self.sample_rate} Hz, {self.chunk_size} chunk size")

    
    def end_recording_session(self):
        if not hasattr(self, "current_session_id") or not self.current_session_id:
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
            result = self.db_handler.store_recordings(recording_metadata)
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
            "ais_start_index": len(self.ais_buffer)
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
        self.ais_buffer.append(ais_data)

        if len(self.ais_buffer) > 1000:
            self.ais_buffer = self.ais_buffer[-1000:]
    
    def save_detection(self, event_id, event_data):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"/tmp/event_{event_id}_{timestamp}.wav"

        with wave.open(filename, "wb") as wav_file:
            wav_file.setnchannels(self.channels)
            wav_file.setsampwidth(self.bytes_per_sample)
            wav_file.setframerate(self.sample_rate)
            wav_file.writeframes(event_data["buffer"])
        
        print(f"WAV file created: {filename}")

        end_time = datetime.now()
        duration = (end_time - event_data["start_time"]).total_seconds()

        relevant_ais_data = []
        for ais_entry in self.ais_buffer[event_data["ais_start_index"]:]:
            if event_data["start_time"] <= ais_entry.get("timestamp", datetime.now()) <= end_time:
                relevant_ais_data.append(ais_entry)

        try:
            self.db_handler.store_ais_data(relevant_ais_data)
            print(f"Relevant AIS-data stored in MongoDB")
        except Exception as e:
            print(f"Error storing relevant AIS-data in MongoDB {e}")

        try:
            storage_info = upload_file(filename)
            print(f"File uploaded to MinIO: {storage_info}")
        except Exception as e:
            print(f"Error uploading to MinIO: {e}")
            storage_info = {"error": str(e)}

        associated_ais_data = self.db_handler.get_ais_log_id_in_timerange(event_data["start_time"], end_time)

        detection_metadata = {
            "detection_id": event_id,
            "start_time": event_data['start_time'],
            "end_time": end_time,
            "duration": duration,
            "type": "type", 
            "hydrophone_id": "id",
            "filename": os.path.basename(filename),
            "file_size_bytes": len(event_data['buffer']) + 44,
            "storage_location": storage_info,
            "associated_ais_data": associated_ais_data,
            "num_ais_entries": len(relevant_ais_data),
            "recording_id": self.current_session_id
        }

        detection_metadata.update(event_data["metadata"])

        try:
            self.db_handler.store_detections(detection_metadata)
            print(f"Detection metadata stored in MongoDB")
        except Exception as e:
            print(f"Error storing metadata in MongoDB: {e}")

        try:
            os.remove(filename)
            print(f"Local file removed: {filename}")
        except Exception as e:
            print(f"Error removing local file: {e}")

        return detection_metadata
        

async def consume_audio(recorder):
    consumer = AIOKafkaConsumer(
        recorder.broker_info["topicName"],
        bootstrap_servers=f"{recorder.broker_info['ip']}:{recorder.broker_info['brokerPort']}",
        auto_offset_reset="latest"
    )

    await consumer.start()
    try:
        print(f"Started consuming audio from {recorder.broker_info['topicName']}")
        async for msg in consumer:
            recorder.add_audio_chunk(msg.value)
    finally:
        await consumer.stop()

async def consume_ais_data(recorder):
    consumer = AIOKafkaConsumer(
        "ais-data",
        bootstrap_servers=f"{recorder.broker_info['ip']}:{recorder.broker_info['brokerPort']}",
        auto_offset_reset="latest",
        value_deserializer=lambda m: json.loads(m.decode("utf-8"))
    )
    
    await consumer.start()
    try:
        print("Started consuming AIS data from ais-data")
        async for msg in consumer:
            recorder.add_ais_data(msg.value)
    finally:
        await consumer.stop()

async def listen_for_events(recorder):
    consumer = AIOKafkaConsumer(
        "detection-events",
        bootstrap_servers=f"{recorder.broker_info['ip']}:{recorder.broker_info['brokerPort']}",
        auto_offset_reset="latest",
        value_deserializer=lambda m: json.loads(m.decode("utf-8"))
    )

    await consumer.start()
    try:
        print("Started listening for events from detection-events")
        async for msg in consumer:
            event_data = msg.value
            event_id = event_data.get("event_id", str(uuid.uuid4()))
            threshold_reached = event_data.get("threshold_reached", False)

            if threshold_reached:
                if event_id not in recorder.active_events:
                    recorder.start_event_detection(event_id, event_data)
                    print(f"Started recording for threshold event: {event_id}")
            else:
                if event_id in recorder.active_events:
                    recorder.stop_event_detection(event_id)
                    print(f"Stopped recording for threshold event: {event_id}")
    finally:
        await consumer.stop()

async def main():
    recorder = AudioEventRecorder()
    
    await asyncio.gather(
        consume_audio(recorder),
        consume_ais_data(recorder),
        listen_for_events(recorder)
    )

if __name__ == "__main__":
    asyncio.run(main())