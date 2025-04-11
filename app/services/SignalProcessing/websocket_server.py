import asyncio
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
import numpy as np
import websockets
from urllib.parse import parse_qs, urlparse
import json
import os
import uuid
import datetime
from utils import calculate_bytes_per_sample, calculate_required_samples
from SignalProcessingService import SignalProcessingService
from AudioEventRecorder import AudioEventRecorder

'''

This function will read the current recording config from a Kafka topic

    config looks like this:
        {
            "channels": 1,
            "sampleRate": 44100,
            "recordingChunkSize": 1024,
            "bitDepth": 16,
        }

    I recv the message from the broker and write it to a local json file
    in app/configs/recording_config.json for easy reading throughout app

    When 'spectrogram_client' first connects, expect the following config payload:

            {

                "spectrogramConfiguration": {
                    "tperseg": int,
                    "frequencyFilter": int (odd),
                    "horizontalFilterLength": int,
                    "window": string,
                    "narrowbandThreshold": int,
                },
                "demonSpectrogramConfiguration":{
                    "demonSampleFrequency": int,
                    "tperseg": int,
                    "frequencyFilter": int (odd),
                    "horizontalFilterLength": int,
                    "window": string
                },
            }
    When 'broadband_client' first connects, expect the following config payload:
            {
                "broadbandThreshold": int,
                "windowSize": int,
                "hilbertWindow": int,
                "bufferLength": int
            }
'''

################## GLOBAL VARIABLES #########################

clients = {}                   # This dictionary holds a clients websocket and name
spectrogram_client_config = {} # This will hold configurations for spectrogram and DEMON spectrogram and narrowband threshold
broadband_client_config = {}
recording_config = {}          # This dict holds the most recent recording config
BOOTSTRAP_SERVERS = 'localhost:9092'

# Will be an instantiated SignalProcessingService when the server is running
signal_processing_service: SignalProcessingService = None

'''These variables buffer audio data that gets sent to the signal_processing_service'''
spectrogram_audio_buffer = b"" # A byte array to accumulate audio for the spectrogram
demon_spectrogram_audio_buffer = b"" # A byte array to accumulate audio for the demon spectrogram
broadband_buffer = b"" # Holds window_size seconds of audio data
broadband_total_buffer = b"" # Hold buffer_length seconds of audio data
broadband_signal_buffer = [] # An array for holding processed broadband_signal chunks of window_size seconds
broadband_kernel_buffer = [] # A buffer used for OLA (Overlap-Add method)

'''
    These global variables will hold information for how much data must be collected in a buffer before the spectrogram data can be produced
    They will be set when 'spectrogram_client connects'
'''
demon_required_buffer_size = None
spectrogram_required_buffer_size = None
broadband_required_buffer_size = None # This represents window_size seconds of data to be added to the broadband_buffer
broadband_total_required_buffer_size = None # This represents the WHOLE buffer of N seconds of audio-data to be analyzed
current_recording_status = False

################## GLOBAL VARIABLES END #####################

async def consume_recording_config():
    """Async function to consume configuration messages from Kafka before WebSocket server starts."""
    global recording_config

    while True:
        try:
            topic = 'recording-parameters'
            consumer = AIOKafkaConsumer(
                topic,
                bootstrap_servers=BOOTSTRAP_SERVERS,
                auto_offset_reset='latest',
                enable_auto_commit=False,
                value_deserializer=lambda m: json.loads(m.decode('utf-8'))
            )

            await consumer.start()
            print("Connected to Kafka, waiting for configuration...")
            try:
                message = await consumer.getone()
                config_data = message.value
                
                # Create the target directory two levels up
                target_directory = os.path.join(os.path.dirname(__file__), "../../../configs")
                os.makedirs(target_directory, exist_ok=True)  # Ensure the 'configs' directory exists

                # Define the file path within the 'configs' directory
                file_path = os.path.join(target_directory, 'recording_parameters.json')

                with open(file_path, 'w') as json_file:
                    json.dump(config_data, json_file, indent=4)
                    print(f"Configuration saved to {file_path}")

                recording_config =config_data
                return config_data
            finally:
                await consumer.stop()
        except Exception as e:
            print(f"Error consuming configuration: {e}. Retrying in 5 seconds...")
            await asyncio.sleep(5)


async def consume_audio(recorder):
    consumer = AIOKafkaConsumer(
        "audio-stream",
        bootstrap_servers=BOOTSTRAP_SERVERS,
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
        bootstrap_servers=BOOTSTRAP_SERVERS,
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
        bootstrap_servers=BOOTSTRAP_SERVERS,
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
                await produce_recording_status(False)
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
                    await produce_recording_status(True)
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
                    await produce_recording_status(False)
                    
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

async def produce_recording_status(is_recording):
    """
    Produce recording status to Kafka and forward to connected clients.
    
    This function:
    1. Updates the global recording status
    2. Publishes status to Kafka topic for other services
    3. Forwards status to any connected frontend clients
    
    Args:
        is_recording: Boolean indicating if recording is in progress
        
    Returns:
        bool: Success of the operation
    """
    global current_recording_status
    
    # Convert to boolean to ensure consistency
    is_recording = bool(is_recording)
    
    # Update our global tracking (even if unchanged, to ensure consistency)
    current_recording_status = is_recording
    
    # Produce to Kafka
    topic = 'recording-status'
    producer = AIOKafkaProducer(
        bootstrap_servers=BOOTSTRAP_SERVERS,
        value_serializer = lambda v: (1 if v else 0).to_bytes(1, byteorder='big')
    )
    
    await producer.start()
    try:
        kafka_message = {
            "is_recording": is_recording,
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        await producer.send(topic, kafka_message)
        await producer.flush()
    except Exception as e:
        print(f"Error producing recording status: {e}")
        await producer.stop()
        return False
    finally:
        await producer.stop()
        
    # Try to forward to any connected clients
    try:
        # Import here to avoid circular imports
        success = await forward_recording_status_to_frontend(is_recording)
        return success
    except Exception as e:
        print(f"Error forwarding recording status to frontend: {e}")
        return False
        

'''Function will produce a narrowband detection on the intensities passed and write it to the appropriate kafka topic'''
async def produce_narrowband_detection_result(spectrogram_db: list[float], threshold: float) -> bool:
    global signal_processing_service

    topic = 'narrowband-detection'
    producer = AIOKafkaProducer(bootstrap_servers=BOOTSTRAP_SERVERS,
                value_serializer = lambda v: (1 if v else 0).to_bytes(1, byteorder='big'))

    await producer.start()
    try:
        is_detection = signal_processing_service.narrowband_detection(spectrogram_db, threshold)
        await producer.send(topic, value=is_detection)
        await producer.flush()
    except Exception as e:
        print(f"Error producing result in 'produce_narrowband_detection_result': '{e}'")
    finally:
        await producer.stop()

    return is_detection

'''Function will produce a broadband detection on the buffer passed and write it to the appropriate kafka topic'''
async def produce_broadband_detection_result(broadband_filo_signal_buffer: np.ndarray, threshold: int, window_size: int) -> bool:
    global signal_processing_service

    topic = 'broadband-detection'
    producer = AIOKafkaProducer(bootstrap_servers=BOOTSTRAP_SERVERS,
                                value_serializer= lambda v: (1 if v else 0).to_bytes(1, byteorder='big'))
    
    await producer.start()
    try:
        is_detection = signal_processing_service.broadband_detection(broadband_filo_signal_buffer, threshold, window_size)
        await producer.send(topic, value=is_detection)
        await producer.flush()
    except Exception as e:
        print(f"Error producing result in 'produce_broadband_detection_result': '{e}'")
    finally:
        await producer.stop()
    
    return is_detection

async def produce_override_message(value: bool):
    topic = 'override-detection'
    producer = AIOKafkaProducer(
        bootstrap_servers=BOOTSTRAP_SERVERS,
        value_serializer=lambda v: (1 if v else 0).to_bytes(1, byteorder='big')
    )
    
    await producer.start()
    try:
        await producer.send(topic, value)
        await producer.flush()
        return True
    except Exception as e:
        print(f"Error producing override message: {e}")
        return False
    finally:
        await producer.stop()

async def handle_connection(websocket, path):

    '''Global variables for tracking relevant sizes'''
    global demon_required_buffer_size
    global spectrogram_required_buffer_size
    global broadband_required_buffer_size
    global broadband_total_required_buffer_size

    '''Global dicts for storing config'''
    global spectrogram_client_config
    global broadband_client_config

    '''Global variables containing buffer data'''
    global broadband_total_buffer
    global broadband_buffer
    global spectrogram_audio_buffer
    global demon_spectrogram_audio_buffer
    global broadband_signal_buffer
    
    parsed_url = urlparse(path)
    query_params = parse_qs(parsed_url.query)

    client_name = query_params.get('client_name', ['Uknown'])[0]
    print(f"Client {client_name} connected to WebSocket from {websocket.remote_address}")
    clients[client_name] = websocket

    try:
        if client_name == "audio_consumer":
            async for message in websocket:

                try:
                    await forward_audio_to_frontend(message)
                    
                    '''Only forward audio data if configurations are valid'''
                    if spectrogram_client_config:
                        await forward_signal_processed_data_to_frontend(message)
                        await forward_demon_data_to_frontend(message)
                    
                    if broadband_client_config:
                        await forward_broadband_data_to_frontend(message)
                        
                except Exception as e:
                    print(f"Error processing message: {e}")

        if client_name == "status_client":
            async for message in websocket:
                try:
                    data = json.loads(message)
                    if "value" in data:
                        value = bool(data["value"])
                        success = await produce_recording_status(value)
                except Exception as e:
                    print(f"Error processing message {e}")
            
                    
        if client_name == "ais_consumer":
            async for message in websocket:
                try:
                    await forward_ais_to_frontend(message)
                except Exception as e:
                    print(f"Error processing message {e}")

        if client_name == "map_client":
            async for message in websocket:
                try:
                    print(f"Received message from map_client: {message[:10]}...")
                except Exception as e:
                    print(f"Error processing message: {e}")

        if client_name == "override_client":
            async for message in websocket:
                try:
                    data = json.loads(message)
                    if "value" in data:
                        value = bool(data["value"])
                        success = await produce_override_message(value)
                        
                        if success:
                            ack = {"status": "delivered", "value": value}
                            await websocket.send(json.dumps(ack))
                        else:
                            error_msg = {"status": "error", "message": "Failed to send override message"}
                            await websocket.send(json.dumps(error_msg))
                    else:
                        error_msg = {"status": "error", "message": "Message must contain 'value' field"}
                        await websocket.send(json.dumps(error_msg))
                except json.JSONDecodeError:
                    error_msg = {"status": "error", "message": "Invalid JSON format"}
                    await websocket.send(json.dumps(error_msg))
                except Exception as e:
                    print(f"Error handling message from override_client: {e}")
                    error_msg = {"status": "error", "message": str(e)}
                    await websocket.send(json.dumps(error_msg))


        if client_name == "spectrogram_client":
            async for message in websocket:
                try:
                    data = json.loads(message)
                    '''Set the recvd config sent onconnect'''
                    if "spectrogramConfiguration" in data:
                        spectrogram_client_config[client_name] = data

                        sample_rate = recording_config["sampleRate"]

                        bytes_per_sample = calculate_bytes_per_sample(recording_config["bitDepth"], recording_config["channels"])

                        '''Set buffer size for demon data'''
                        _, _, _, demon_hfilt_length, _ = get_demon_spectrogram_config(spectrogram_client_config)
                        demon_required_samples = calculate_required_samples(demon_hfilt_length, sample_rate)
                        demon_required_buffer_size = demon_required_samples * bytes_per_sample

                        '''Set buffer size for spectrogram data'''
                        _, _, spectrogram_hfilt_length, _, _ = get_spectrogram_config(spectrogram_client_config)
                        spectrogram_required_samples = calculate_required_samples(spectrogram_hfilt_length, sample_rate)
                        spectrogram_required_buffer_size = spectrogram_required_samples * bytes_per_sample

                        print(f"Updated spectrogram configuration: {spectrogram_client_config[client_name]}")
                    else:
                        print(f"Received unknow message from {client_name}: {data}")

                except Exception as e:
                    print(f"Error handling message from {client_name}: {e}")

        if client_name == "broadband_client":
            async for message in websocket:
                try:
                    data = json.loads(message)

                    '''Set the recvd broadband config onconnect'''
                    if "broadbandThreshold" in data:
                        broadband_client_config[client_name] = data
                        sample_rate = recording_config["sampleRate"]

                        bytes_per_sample = calculate_bytes_per_sample(recording_config["bitDepth"], recording_config["channels"])

                        '''Set buffer sizes for broadband data'''
                        _, window_size, _, buffer_length = get_broadband_config(broadband_client_config)
                        broadband_required_samples = calculate_required_samples(window_size, sample_rate)
                        broadband_total_required_samples = calculate_required_samples(buffer_length, sample_rate)
                        broadband_required_buffer_size = broadband_required_samples * bytes_per_sample
                        broadband_total_required_buffer_size = broadband_total_required_samples * bytes_per_sample
                        
                        print(f"Updated broadband configuration: {broadband_client_config[client_name]}")
                    else:
                        print(f"Received unknown message from {client_name}: {e}")
                except Exception as e:
                    print(f"Error handling message from {client_name}: {e}")

        if client_name == "position_client":
            async for message in websocket:
                try:
                    data = json.loads(message)
                    if "type" in data and data["type"] == "user-position" and "data" in data:
                        position_data = data["data"]
                        
                        # Validate position data
                        if (isinstance(position_data, dict) and 
                            "latitude" in position_data and 
                            "longitude" in position_data):
                            
                            # Publish position to Kafka for AIS fetcher
                            success = await produce_user_position(position_data)
                            
                            if success:
                                ack = {"status": "delivered", "position": position_data}
                                await websocket.send(json.dumps(ack))
                            else:
                                error_msg = {"status": "error", "message": "Failed to send position data"}
                                await websocket.send(json.dumps(error_msg))
                        else:
                            error_msg = {"status": "error", "message": "Invalid position data format"}
                            await websocket.send(json.dumps(error_msg))
                    else:
                        error_msg = {"status": "error", "message": "Message must contain 'type' and 'data' fields"}
                        await websocket.send(json.dumps(error_msg))
                except json.JSONDecodeError:
                    error_msg = {"status": "error", "message": "Invalid JSON format"}
                    await websocket.send(json.dumps(error_msg))
                except Exception as e:
                    print(f"Error handling message from position_client: {e}")
                    error_msg = {"status": "error", "message": str(e)}
                    await websocket.send(json.dumps(error_msg))

        if client_name == "status_client":
            # When status client connects, send the current recording status
            try:   
                status_update = {
                    "value": current_recording_status
                }
                status_json = json.dumps(status_update)
                await websocket.send(status_json)
                print(f"Sent initial recording status: {current_recording_status}")
            except Exception as e:
                print(f"Error sending initial status to status_client: {e}")
            
            # Then handle any incoming messages
            async for message in websocket:
                try:
                    data = json.loads(message)
                    if "value" in data:
                        value = bool(data["value"])
                        
                        # Update recording status with the new boolean value
                        success = await produce_recording_status(value)
                        
                        if success:
                            ack = {"status": "delivered", "value": value}
                            await websocket.send(json.dumps(ack))
                        else:
                            error_msg = {"status": "error", "message": "Failed to send status message"}
                            await websocket.send(json.dumps(error_msg))
                    else:
                        error_msg = {"status": "error", "message": "Message must contain 'value' field"}
                        await websocket.send(json.dumps(error_msg))
                except json.JSONDecodeError:
                    error_msg = {"status": "error", "message": "Invalid JSON format"}
                    await websocket.send(json.dumps(error_msg))
                except Exception as e:
                    print(f"Error handling message from status_client: {e}")
                    error_msg = {"status": "error", "message": str(e)}
                    await websocket.send(json.dumps(error_msg))

        if client_name in clients.keys():
            async for message in websocket:
                try:
                    print(f"Received message from {client_name}: {message[:10]}...")
                except Exception as e:
                    print(f"Error handling message from {client_name}: {e}")

    except websockets.exceptions.ConnectionClosed as e:  
            
        print(f"Client '{client_name}' disconnected: {e}")
    finally:
        if client_name in clients and clients[client_name] == websocket:
            
            # Empty the buffers on disconnect
            if client_name == "broadband_client":
                broadband_total_buffer = b""
                broadband_buffer = b""
                broadband_signal_buffer = []
                broadband_kernel_buffer = []
                broadband_total_required_buffer_size = None
                broadband_required_buffer_size = None
                    
            # Empty the buffers on disconnect
            if client_name == "spectrogram_client":
                spectrogram_audio_buffer = b""
                demon_spectrogram_audio_buffer = b""
                demon_required_buffer_size = None
                spectrogram_required_buffer_size = None
            
            clients.pop(client_name, None)
                
            print(f"Removed {client_name} from active clients")

async def forward_recording_status_to_frontend(is_recording):
    """
    Forwards recording status to any connected status clients.
    
    Args:
        is_recording: Boolean indicating if recording is in progress
        
    Returns:
        bool: True if status was successfully sent to at least one client
    """
    if 'status_client' in clients:
        try:
            # Create simple status update message
            status_update = {
                "value": bool(is_recording)
            }
            
            status_json = json.dumps(status_update)
            
            await clients['status_client'].send(status_json)
            return True
        except websockets.exceptions.ConnectionClosed:
            print("Connection to status_client was closed while sending")
            if 'status_client' in clients:
                clients.pop('status_client', None)
            return False
        except Exception as e:
            print(f"Error sending to status_client: {e}")
            return False
    else:
        print("No status_client connected")
        return False

def get_demon_spectrogram_config(spectrogram_client_config):
    demon_spectrogram_config = spectrogram_client_config.get("spectrogram_client").get("demonSpectrogramConfiguration")
    
    if demon_spectrogram_config:
        demon_sample_frequency = demon_spectrogram_config.get("demonSampleFrequency")
        demon_tperseg = demon_spectrogram_config.get("tperseg")
        demon_freq_filter = demon_spectrogram_config.get("frequencyFilter")
        demon_hfilt_length = demon_spectrogram_config.get("horizontalFilterLength")
        demon_window = demon_spectrogram_config.get("window")
        
        return demon_sample_frequency, demon_tperseg, demon_freq_filter, demon_hfilt_length, demon_window
    else:
        print("Demon spectrogram config is not available")
        return None

def get_spectrogram_config(spectrogram_client_config):
    spectrogram_config = spectrogram_client_config.get("spectrogram_client").get("spectrogramConfiguration")
    
    if spectrogram_config:
        tperseg = spectrogram_config.get("tperseg")
        freq_filter = spectrogram_config.get("frequencyFilter")
        hfilt_length = spectrogram_config.get("horizontalFilterLength")
        window = spectrogram_config.get("window")
        narrowband_threshold = spectrogram_config.get("narrowbandThreshold")
        
        return tperseg, freq_filter, hfilt_length, window, narrowband_threshold
    else:
        print("Spectrogram config is not available")
        return None

def get_broadband_config(broadband_client_config):
    broadband_config = broadband_client_config.get("broadband_client")

    if broadband_config:
        broadband_threshold = broadband_config.get("broadbandThreshold")
        window_size = broadband_config.get("windowSize")
        hilbert_window = broadband_config.get("hilbertWindow")
        buffer_length = broadband_config.get("bufferLength")

        return broadband_threshold, window_size, hilbert_window, buffer_length
    else:
        print("Broadband config is not available")
        return None

async def forward_audio_to_frontend(data):
        
    if 'waveform_client' in clients:
        try:
            await clients['waveform_client'].send(data)
        except websockets.exceptions.ConnectionClosed:
            print("Connection to waveform_client was closed while sending")
            if 'waveform_client' in clients:
                clients.pop('waveform_client', None)
        except Exception as e:
            print(f"Error sending to waveform_client: {e}")

async def forward_ais_to_frontend(data):
    if 'map_client' in clients:
        try:
            # Parse the data
            if isinstance(data, str):
                ais_data = json.loads(data)
            elif isinstance(data, bytes):
                try:
                    ais_data = json.loads(data.decode('utf-8'))
                except UnicodeDecodeError:
                    import base64
                    ais_data = {
                        "type": "binary_data",
                        "data": base64.b64encode(data).decode('ascii')
                    }
            else:
                ais_data = data
            
            # Check for any client parameters
            query_params = {}
            for client_name, websocket in clients.items():
                if client_name == 'map_client':
                    # Extract query parameters if available
                    if hasattr(websocket, 'path') and websocket.path:
                        parsed_url = urlparse(websocket.path)
                        query_params = parse_qs(parsed_url.query)
                    break
            
            # Check if client specified a data source preference
            preferred_source = query_params.get('data_source', ['both'])[0]
            
            # Only forward if the data matches the preferred source
            data_source = ais_data.get('data_source', ais_data.get('original_api_data', {}).get('data_source', 'antenna'))
            
            if preferred_source == 'both' or preferred_source == data_source:
                # Forward the data
                if isinstance(data, str):
                    json_data = data
                else:
                    json_data = json.dumps(ais_data)
                    
                await clients['map_client'].send(json_data)
            
        except websockets.exceptions.ConnectionClosed:
            print("Connection to map_client was closed while sending")
            if 'map_client' in clients:
                clients.pop('map_client', None)
        except Exception as e:
            print(f"Error sending to map_client: {e}")

        
async def forward_broadband_data_to_frontend(data):
    global broadband_client_config
    global broadband_required_buffer_size
    global broadband_total_buffer
    global broadband_buffer
    global broadband_total_required_buffer_size
    global broadband_signal_buffer
    global signal_processing_service
    global broadband_kernel_buffer

    if 'broadband_client' in clients:
        try:
            broadband_threshold, window_size, hilbert_window, _ = get_broadband_config(broadband_client_config)

            # Concating new data in the temp buffer, PCM data
            broadband_buffer += data

            # The small buffer is filled contains window_size seconds of data
            if len(broadband_buffer) >= broadband_required_buffer_size:
                adjusted_broadband_buffer, broadband_buffer = broadband_buffer[:broadband_required_buffer_size], \
                                                              broadband_buffer[broadband_required_buffer_size:]
                
                '''Can here produce the data for broadband plot, signal is a 1D NDarray, t is time'''
                broadband_signal, t, broadband_kernel_buffer_out = signal_processing_service.generate_broadband_data(adjusted_broadband_buffer, broadband_kernel_buffer, hilbert_window, window_size)
                
                #Adjust the kernel buffer for next iteration
                broadband_kernel_buffer = broadband_kernel_buffer_out
                
                data_dict = {
                    "broadbandSignal": broadband_signal.tolist(), # NDArrays are not JSON serializable, must convert to list
                    "times": t.tolist()
                }
                data_json = json.dumps(data_dict)
                print("Sending broadband data...")
                await clients["broadband_client"].send(data_json)

                # Appending window_size seconds of data to the total buffer, this buffer is used to keep track of the total length in seconds
                broadband_total_buffer += adjusted_broadband_buffer

                # Appending the signal to the FILO broadband_signal_buffer, this buffer is purely used for analysis
                broadband_signal_buffer.append(broadband_signal)

                # If this is true, we want to remove the first window_size seconds of data from broadband_total_buffer and broadband_signal_buffer
                if len(broadband_total_buffer) >= broadband_total_required_buffer_size:

                    '''Buffer gets resized such that, only the bytes from window_size and up gets included'''
                    adjusted_broadband_total_buffer = broadband_total_buffer[broadband_required_buffer_size:] # broadband_required_buffer_size represents window_size seconds of data
                    broadband_total_buffer = adjusted_broadband_total_buffer

                    # Buffer is full, we want to remove oldest window_size entry, which will be element at index zero
                    broadband_signal_buffer.pop(0) 
                    
                broadband_signal_to_analyze = np.ravel(broadband_signal_buffer) # Flatten matrix

                '''Can now perform broadband detection on the buffer and produce the result to Kafka'''
                is_detection = await perform_broadband_detection(broadband_signal_to_analyze, broadband_threshold,
                                                                            window_size)
                detection_dict = {
                    "detectionStatus": bool(is_detection)
                }

                detection_json = json.dumps(detection_dict)
                await clients["broadband_client"].send(detection_json)

        except websockets.exceptions.ConnectionClosed:
            print("Connection to broadband_client was closed while sending")
            if  'broadband_client' in clients:
                clients.pop('broadband_client', None)
        except Exception as e:
            print(f"Error sending to broadband_client from 'forward_broadband_data_to_frontend': {e}")           

async def perform_broadband_detection(broadband_filo_signal_buffer: bytes, threshold: int, window_size: int):

    try:
        return await produce_broadband_detection_result(broadband_filo_signal_buffer, threshold, window_size)
    except Exception as e:
        print(f"Error during broadband detection: {e}")
    
    return False


async def forward_demon_data_to_frontend(data):
    global demon_spectrogram_audio_buffer
    global demon_required_buffer_size
    global spectrogram_client_config
    global signal_processing_service

    if 'spectrogram_client' in clients:
        try:

            demon_sample_frequency, demon_tperseg, demon_freq_filter, demon_hfilt_length, demon_window = get_demon_spectrogram_config(spectrogram_client_config)
            
            '''concat recvd audio, build buffer'''
            demon_spectrogram_audio_buffer += data

            '''Enough audio data for demon spectrogram data gen'''
            if len(demon_spectrogram_audio_buffer) >= demon_required_buffer_size:

                '''Adjusting the audio buffer so the amount of audio processed is always the same relative to required_buffer_size'''
                adjusted_demon_spectrogram_audio_buffer, demon_spectrogram_audio_buffer = demon_spectrogram_audio_buffer[:demon_required_buffer_size], demon_spectrogram_audio_buffer[demon_required_buffer_size:]
                demon_frequencies, demon_times, demon_spectrogram_db = signal_processing_service.generate_demon_spectrogram_data(adjusted_demon_spectrogram_audio_buffer,
                                                                                                                                demon_sample_frequency, demon_tperseg, demon_freq_filter, demon_hfilt_length, demon_window)                                                                          
                '''We flatten the demon_spectrogram_db matrix since it will we a matrix with only one column'''
                demon_data_dict = {
                    "demonFrequencies": demon_frequencies,
                    "demonTimes": demon_times,
                    "demonSpectrogramDb": np.ravel(demon_spectrogram_db).tolist()
                }

                demon_data_json = json.dumps(demon_data_dict)
                print("Sending demon spectrogram data...")
                await clients['spectrogram_client'].send(demon_data_json)
                                                                                                                                                                                
        except websockets.exceptions.ConnectionClosed:
            print("Connection to spectrogram_client was closed while sending")
            if 'spectrogram_client' in clients:
                clients.pop('spectrogram_client', None)
        except Exception as e:
            print(f"Error sending to spectrogram_client from 'forward_demon_data_to_frontend': {e}")

'''Function performs narrowband detection as well produces spectrogram data'''
async def forward_signal_processed_data_to_frontend(data):
    global spectrogram_audio_buffer
    global spectrogram_required_buffer_size
    global spectrogram_client_config
    global signal_processing_service

    if 'spectrogram_client' in clients:
        try:

            tperseg, freq_filter, hfilt_length, window, narrowband_threshold = get_spectrogram_config(spectrogram_client_config)
            
            '''concat recvd audio, build buffer'''
            spectrogram_audio_buffer += data

            '''Enough audio data for spectrogram data gen, also performs narrowband detection'''
            if len(spectrogram_audio_buffer) >= spectrogram_required_buffer_size:
                
                '''Adjusting the audio buffer so the amount of audio processed is always the same relative to required_buffer_size'''
                adjusted_spectrogram_audio_buffer, spectrogram_audio_buffer = spectrogram_audio_buffer[:spectrogram_required_buffer_size], \
                                                                              spectrogram_audio_buffer[spectrogram_required_buffer_size:]

                frequencies, times, spectrogram_db = signal_processing_service.generate_spectrogram_data(adjusted_spectrogram_audio_buffer, tperseg, freq_filter, hfilt_length, window)

                '''We flatten the spectrogram_db matrix since it will we a matrix with only one column'''
                spectrogram_db_flattened = np.ravel(spectrogram_db)
                data_dict = {
                    "frequencies": frequencies,
                    "times": times,
                    "spectrogramDb": spectrogram_db_flattened.tolist()
                }

                '''Function expects an np.ndarray for efficient vectorized numpy calculations'''
                is_detection = await perform_narrowband_detection(spectrogram_db_flattened, narrowband_threshold)

                data_json = json.dumps(data_dict)
                print("Sending spectrogram data...")
                await clients['spectrogram_client'].send(data_json)

                detection_dict = {
                    "detectionStatus": bool(is_detection)
                }
                
                detection_json = json.dumps(detection_dict)
                await clients["spectrogram_client"].send(detection_json)
                                                                                                                                                               
        except websockets.exceptions.ConnectionClosed:
            print("Connection to spectrogram_client was closed while sending")
            if 'spectrogram_client' in clients:
                clients.pop('spectrogram_client', None)
        except Exception as e:
            print(f"Error sending to spectrogram_client: {e}")

async def perform_narrowband_detection(spectrogram_db_flattened: np.ndarray, narrowband_threshold: int) -> bool:
    """
    Perform narrowband detection based on the spectrogram data.
    Returns True if a narrowband signal is detected, otherwise False.
    """
    try:
        return await produce_narrowband_detection_result(spectrogram_db_flattened, narrowband_threshold)
        return is_detection
    except Exception as e:
        print(f"Error during narrowband detection: {e}")
    
    return False

async def produce_user_position(position_data):
    """Publish user position data to Kafka for AIS filtering"""
    topic = 'user-position'
    producer = AIOKafkaProducer(
        bootstrap_servers=BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    
    await producer.start()
    try:
        await producer.send(topic, position_data)
        await producer.flush()
        return True
    except Exception as e:
        print(f"Error producing user position message: {e}")
        return False
    finally:
        await producer.stop()


async def main():
    global signal_processing_service
    global recording_config

    try:
        print("Loading configuration from Kafka...")
        recording_config = await consume_recording_config()

        if not recording_config:
            raise RuntimeError("Failed to load configuration from Kafka")
        
        print(f"Configuration loaded: {recording_config}")

        '''Recording MUST be set before the server is served så that the signal_processing_service is instantiated'''
        signal_processing_service = SignalProcessingService(
            sample_rate=recording_config["sampleRate"],
            num_channels=recording_config["channels"],
            bit_depth=recording_config["bitDepth"]
        )

        recorder = AudioEventRecorder(
            sample_rate=recording_config["sampleRate"],
            num_channels=recording_config["channels"],
            bit_depth=recording_config["bitDepth"]
        )
        

        websocket_server = websockets.serve(
            handle_connection, 
            "localhost",
            8766,
            ping_interval=30,
            ping_timeout=10
        )

        await asyncio.gather(
        consume_audio(recorder),
        consume_ais_data(recorder),
        listen_for_events(recorder),
        websocket_server
            )
    except Exception as e:
        print(f"Error during startup: {e}")
        raise

asyncio.run(main())