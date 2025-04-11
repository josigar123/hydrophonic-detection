import asyncio
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
import numpy as np
import websockets
from urllib.parse import parse_qs, urlparse
import json
import os
from utils import calculate_bytes_per_sample, calculate_required_samples
from SignalProcessingService import SignalProcessingService

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
                "bufferLength": int,
                "windowInMin": int,
            }
'''

################## GLOBAL VARIABLES #########################

clients = {}                   # This dictionary holds a clients websocket and name
spectrogram_client_config = {} # This will hold configurations for spectrogram and DEMON spectrogram and narrowband threshold
broadband_client_config = {}
recording_config = {}          # This dict holds the most recent recording config
BOOTSTRAP_SERVERS = '10.0.0.24:9092'

# Will be an instantiated SignalProcessingService when the server is running
signal_processing_service: SignalProcessingService = None

'''These variables buffer audio data that gets sent to the signal_processing_service'''
spectrogram_audio_buffer = b"" # A byte array to accumulate audio for the spectrogram
demon_spectrogram_audio_buffer = b"" # A byte array to accumulate audio for the demon spectrogram
broadband_buffer = b"" # Holds window_size seconds of audio data
broadband_total_buffer = b"" # Hold buffer_length seconds of audio data
broadband_signal_buffer = [] # An array for holding processed broadband_signal chunks of window_size seconds, a matrix
broadband_kernel_buffer = [] # A buffer used for OLA (Overlap-Add method)
broadband_kernel_buffers_for_each_channel = [] # Used for OLA on each individual channel
# Holds an entry of entries, each entry represents a channels broadband sig, each entries entry represents
# window_size seconds of data
broadband_signal_buffers_for_each_channel = [] 

'''
    These global variables will hold information for how much data must be collected in a buffer before the spectrogram data can be produced
    They will be set when 'spectrogram_client connects'
'''
demon_required_buffer_size = None
spectrogram_required_buffer_size = None
broadband_required_buffer_size = None # This represents window_size seconds of data to be added to the broadband_buffer
broadband_total_required_buffer_size = None # This represents the WHOLE buffer of N seconds of audio-data to be analyzed

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
        return is_detection
    except Exception as e:
        print(f"Error producing result in 'produce_narrowband_detection_result': '{e}'")
        return False
    finally:
        await producer.stop()

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
        return is_detection
    except Exception as e:
        print(f"Error producing result in 'produce_broadband_detection_result': '{e}'")
        return False
    finally:
        await producer.stop()

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
                    
                    '''Only forward audio data if configurations are valid and appropriate buffers are set'''
                    if spectrogram_client_config and spectrogram_required_buffer_size and demon_required_buffer_size:
                        await forward_signal_processed_data_to_frontend(message)
                        await forward_demon_data_to_frontend(message)
                    
                    if broadband_client_config and broadband_required_buffer_size and broadband_total_required_buffer_size:
                        await forward_broadband_data_to_frontend(message)
                        
                except Exception as e:
                    print(f"Error processing message: {e}")
                    
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
    global broadband_kernel_buffers_for_each_channel
    global broadband_signal_buffers_for_each_channel
    
    if 'broadband_client' in clients:
        try:
            broadband_threshold, window_size, hilbert_window, _ = get_broadband_config(broadband_client_config)

            # Concating new data in the temp buffer, PCM data
            broadband_buffer += data

            # The small buffer is filled contains window_size seconds of data
            if len(broadband_buffer) >= broadband_required_buffer_size:
                adjusted_broadband_buffer, broadband_buffer = broadband_buffer[:broadband_required_buffer_size], \
                                                              broadband_buffer[broadband_required_buffer_size:]
                
                '''Can here produce the data for broadband plot, signal is a 1D NDarray, t is time, also a kernel buffer is returned as well as each individual channels broadband signal'''
                broadband_signal, t, broadband_kernel_buffer_out = signal_processing_service.generate_broadband_data(adjusted_broadband_buffer, broadband_kernel_buffer, hilbert_window, window_size)
                ''' Produce broadband data for each channel, ONLY used for analysis and detection, No visualization
                    Both values are matrices, each row in broadband_signals represents a channels bb data (A 1D array each channel)
                    Each row i broadband_kernel_buffers_for_each_channel_out represents each channels kernel (A 1D array each channel)
                '''
                broadband_signals, broadband_kernel_buffers_for_each_channel_out = signal_processing_service.generate_broadband_data_for_each_channel(adjusted_broadband_buffer, broadband_kernel_buffers_for_each_channel, hilbert_window, window_size)
                
                #Adjust the kernel buffer for next iteration
                broadband_kernel_buffer = broadband_kernel_buffer_out
                broadband_kernel_buffers_for_each_channel = broadband_kernel_buffers_for_each_channel_out
                
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

                # Appending all signal data to the buffer
                for index, broadband_signal in enumerate(broadband_signals):
                    broadband_signal_buffers_for_each_channel[index].append(broadband_signal)
                
                # If this is true, we want to remove the first window_size seconds of data from broadband_total_buffer and broadband_signal_buffer
                if len(broadband_total_buffer) >= broadband_total_required_buffer_size:

                    '''Buffer gets resized such that, only the bytes from window_size and up gets included'''
                    adjusted_broadband_total_buffer = broadband_total_buffer[broadband_required_buffer_size:] # broadband_required_buffer_size represents window_size seconds of data
                    broadband_total_buffer = adjusted_broadband_total_buffer

                    # Buffer is full, we want to remove oldest window_size entry, which will be element at index zero
                    broadband_signal_buffer.pop(0) 
                    
                    # For each channel, we want to remove first element
                    for index, _ in enumerate(broadband_signal_buffers_for_each_channel):
                        broadband_signal_buffers_for_each_channel[index].pop(0)
                    
                broadband_signal_to_analyze = np.concatenate(broadband_signal_buffer) # Flatten matrix

                broadband_signals_to_analyze = []
                # each 'broadband_signal' is a matrix [[...], [...], ...]
                for index, broadband_signal in enumerate(broadband_signal_buffers_for_each_channel):
                    broadband_signals_to_analyze.append(np.concatenate(broadband_signal))
                
                detections_dict = {"detections": {}}
            
                '''Can now perform broadband detection on the buffer and produce the result to Kafka'''
                is_detection = await perform_broadband_detection(broadband_signal_to_analyze, broadband_threshold, window_size)

                '''Also want to perform a detection for each channel, these results are only for the frontend to use'''
                for index, broadband_sig in enumerate(broadband_signals_to_analyze):
                    is_detection_in_broadband_signal = signal_processing_service.broadband_detection(broadband_sig, broadband_threshold, window_size)
                    detections_dict["detections"][f'channel{index + 1}'] = bool(is_detection_in_broadband_signal)
                
                # This detection is based upon all the channels, calculated in the broadband_detection function
                detections_dict["detections"]["summarizedDetection"] = bool(is_detection)
                
                '''
                    Object will look like this:
                        detections: {
                            "channel1": true,
                            ...             ,
                            summarizedDetection: true
                        }
                '''
                
                # Send detectino for each channel
                detections_json = json.dumps(detections_dict, indent=2)
                print(detections_json)
                await clients["broadband_client"].send(detections_json)

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
        print(f"User position sent to Kafka topic '{topic}': {position_data}")
        return True
    except Exception as e:
        print(f"Error producing user position message: {e}")
        return False
    finally:
        await producer.stop()


async def main():
    global signal_processing_service
    global recording_config

    global broadband_kernel_buffers_for_each_channel
    global broadband_signal_buffers_for_each_channel
    
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

        '''Initialize per channel broadband buffers with config'''
        broadband_kernel_buffers_for_each_channel = [np.array([]) for _ in range(recording_config["channels"])]
        broadband_signal_buffers_for_each_channel = [[] for _ in range(recording_config["channels"])]
        
        async with websockets.serve(
            handle_connection, 
            "localhost",
            8766,
            ping_interval=30,
            ping_timeout=10
        ) as server:
            print("WebSocket server running on ws://localhost:8766")
            await server.wait_closed()
    except Exception as e:
        print(f"Error during startup: {e}")
        raise

asyncio.run(main())