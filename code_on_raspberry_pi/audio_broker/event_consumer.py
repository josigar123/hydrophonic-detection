import asyncio 
import json
import os
import wave
from datetime import datetime
import uuid
from aiokafka import AIOKafkaConsumer
from datetime import timedelta
import sys
# Get the absolute path to the project root
current_dir = os.path.dirname(os.path.abspath(__file__))  # audio_broker directory
project_root = os.path.dirname(os.path.dirname(current_dir))  # hydrophonic-detection directory

# Import the modules directly using their absolute file paths
sys.path.insert(0, os.path.join(project_root, "app", "services", "Database"))

# Now import the modules directly
from mongodb_handler import MongoDBHandler
from minio_handler import upload_file


"""
This module handles audio event detection and recording.
It processes audio streams and detection signals from Kafka topics,
correlates them with AIS vessel data, and stores recordings in MinIO with
metadata in MongoDB.
"""

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
        print(f"Started recording event {event_id}")
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

        print(f"Detection time range: {start_time} to {end_time}")
        print(f"Buffered time range for AIS data: {buffer_start_time} to {buffer_end_time}")

      
        relevant_ais_data = []
        for ais_entry in self.ais_buffer:
            try:
            
                entry_timestamp = parse_timestamp(ais_entry.get("timestamp"))

                if buffer_start_time <= entry_timestamp <= buffer_end_time:
                    entry_copy = ais_entry.copy()
                    relevant_ais_data.append(entry_copy)
                    
            except Exception as e:
                print(f"Error processing AIS entry timestamp: {e}")
                continue
        try:
            stored_ids = self.db_handler.store_ais_data(relevant_ais_data)
            print(f"Stored {len(stored_ids)} AIS data entries in MongoDB")
        except Exception as e:
            print(f"Error storing relevant AIS-data in MongoDB {e}")
            stored_ids = []

        try:
            storage_info = upload_file(filename, self.current_session_id, event_id)
            print(f"File uploaded to MinIO: {storage_info}")
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
        "audio-stream",
        bootstrap_servers=f"{recorder.broker_info['ip']}:{recorder.broker_info['port']}",
        auto_offset_reset="latest"
    )

    await consumer.start()
    try:
        print(f"Started consuming audio from audio-stream")
        async for msg in consumer:
            recorder.add_audio_chunk(msg.value)
    finally:
        await consumer.stop()

async def consume_ais_data(recorder):
    consumer = AIOKafkaConsumer(
        "ais-log",
        bootstrap_servers=f"{recorder.broker_info['ip']}:{recorder.broker_info['port']}",
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
    """
    Listen for detection events and manage recording lifecycle with debounce logic.
    
    This function:
    1. Consumes messages from narrowband, broadband and override detection topics
    2. Starts recordings when threshold conditions are met
    3. Implements debounce logic to prevent premature recording stops
    4. Handles override mode for manual control
    5. Manages state transitions between different recording states
    """
    consumer = AIOKafkaConsumer(
        "narrowband-detection",
        "broadband-detection",
        "override-detection",
        bootstrap_servers=f"{recorder.broker_info['ip']}:{recorder.broker_info['port']}",
        auto_offset_reset="latest",
        value_deserializer=lambda m: bool(int.from_bytes(m, byteorder='big'))
    )
    await consumer.start()

    topic_states = {
        "narrowband-detection": False,
        "broadband-detection": False,
        "override-detection": False
    }
    prev_auto_detection = False
    debounce_task = None
    in_debounce_period = False
    debounce_cancelled = False

    async def do_debounce_stop(event_id, delay_seconds):
        """
        Inner function to handle debounce timer logic.
        Stops recording if signal remains below threshold for the debounce period.
        """
        nonlocal in_debounce_period, debounce_cancelled
        try:

            await asyncio.sleep(delay_seconds)
            
            if event_id in recorder.active_events:
                print(f"Signal remained below threshold for {delay_seconds}s, stopping recording")
                recorder.stop_event_detection(event_id)
                print("Debounce period completed normally, recording saved")
            else:
                print(f"Event {event_id} is no longer active, debounce timer ignored")
            
        except asyncio.CancelledError:
            print(f"Debounce timer cancelled for event {event_id}")
            debounce_cancelled = True
            raise
        finally:
            in_debounce_period = False
            
            if not debounce_cancelled:
                print("State reset, ready for new events")
            debounce_cancelled = False

    try:
        print("Started listening for events from narrowband and broadband")
        async for msg in consumer:
            try:
                # Get current message info
                topic, threshold_reached = msg.topic, msg.value
                
                # Store previous states for comparison
                was_override_active = topic_states["override-detection"]
                
                # Update topic state
                topic_states[topic] = threshold_reached
                
                # Calculate current detection states
                auto_detection_triggered = (topic_states["narrowband-detection"] and 
                                          topic_states["broadband-detection"])
                override_active = topic_states["override-detection"]
                detection_triggered = auto_detection_triggered or override_active
                old_prev_auto_detection = prev_auto_detection
                
                # Get current recording state
                is_recording = len(recorder.active_events) > 0
                current_event_id = list(recorder.active_events.keys())[0] if is_recording else None
                
                # Check if current recording is an override
                is_override_event = False
                if current_event_id and current_event_id in recorder.active_events:
                    is_override_event = recorder.active_events[current_event_id].get("metadata", {}).get("is_override", False)

                # Update state for next iteration
                prev_auto_detection = auto_detection_triggered

                # --- STATE TRANSITIONS ---
                
                # Start new recording when conditions are met
                if detection_triggered and not is_recording and not in_debounce_period:
                    start_new_recording(recorder, topic_states)
                    # Cancel any lingering debounce task
                    if debounce_task and not debounce_task.done():
                        debounce_task.cancel()
                        debounce_task = None
                    in_debounce_period = False

                # Override deactivation - stop immediately 
                elif (topic == "override-detection" and was_override_active and 
                      not threshold_reached and is_recording and is_override_event):
                    print(f"Override deactivated - stopping recording immediately")
                    recorder.stop_event_detection(current_event_id)
                    
                    # Clean up debounce state
                    if debounce_task and not debounce_task.done():
                        debounce_task.cancel()
                        debounce_task = None
                    in_debounce_period = False
                    print("Recording saved, state reset and ready for new events")
                    
                # Auto-detection going below threshold - start debounce
                elif (is_recording and not is_override_event and 
                      old_prev_auto_detection and not auto_detection_triggered and 
                      not override_active):
                    # Only start debounce timer if not already in debounce period
                    if not in_debounce_period and (debounce_task is None or debounce_task.done()):
                        in_debounce_period = True
                        debounce_task = asyncio.create_task(
                            do_debounce_stop(current_event_id, recorder.debounce_seconds)
                        )
                        print(f"Signal below threshold, starting {recorder.debounce_seconds}s debounce timer")

                # Override activation during auto-detection
                elif is_recording and not is_override_event and override_active:
                    if debounce_task and not debounce_task.done():
                        debounce_task.cancel()
                        debounce_task = None
                        print(f"Override activated, cancelling debounce timer")
                    
                    # Update metadata to indicate this is now an override
                    if current_event_id in recorder.active_events:
                        recorder.active_events[current_event_id]["metadata"]["is_override"] = True
                        print(f"Event {current_event_id} converted to override")
                    in_debounce_period = False
                
                # Auto-detection retriggered during debounce period
                elif (is_recording and not is_override_event and 
                      auto_detection_triggered and in_debounce_period):
                    if debounce_task and not debounce_task.done():
                        debounce_task.cancel()
                        debounce_task = None
                        in_debounce_period = False
                        print(f"Signal above threshold again, cancelling debounce timer")
                        print(f"Recording continuing, debounce reset")
                
            except Exception as e:
                print(f"Error processing message: {e}", exc_info=True)
    finally:
        await consumer.stop()

def start_new_recording(recorder, topic_states):
    """Helper function to start a new recording with proper metadata"""
    new_event_id = str(uuid.uuid4())
    is_new_override = topic_states["override-detection"]
    recorder.start_event_detection(new_event_id, {"is_override": is_new_override})
    print(f"Started recording for {'override' if is_new_override else 'threshold'} event: {new_event_id}")
    return new_event_id

def parse_timestamp(timestamp_value):
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

async def main():
    recorder = AudioEventRecorder()
    
    await asyncio.gather(
        consume_audio(recorder),
        consume_ais_data(recorder),
        listen_for_events(recorder)
    )

if __name__ == "__main__":
    asyncio.run(main())
