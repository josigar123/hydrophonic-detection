import websockets
import asyncio
import json
from aiokafka import AIOKafkaConsumer
from ServiceUtils.websocket_client import WebSocketClient

'''

This file subscribes to an ais-stream topic on a kafka broker
hosted on the raspberry pi, and consumes data

Consumer must:
First: recieve the ais-data from the broker, that the producer pushes,
Second: for each message received from the broker, have a ws connection where the 
        data is sent to, 

MUST SUPPLY client_name query param when connecting to websocket

'''

BROKER_INFO_RELATIVE_PATH = '../configs/broker_info.json'

async def consume_ais(consumer: AIOKafkaConsumer, socket_client: WebSocketClient):
    ships = {}
    await consumer.start()
    print("Consumer started successfully")

    try:
        print(f"Listening for messages on topic {consumer.subscription()}")
        
        async for msg in consumer:
            try:
                print(f"Received message: {msg.value[:100]}...")  # Debug: Print first 100 chars
                
                # Handle both string and bytes message values
                message_value = msg.value
                if isinstance(message_value, bytes):
                    message_value = message_value.decode('utf-8')
                
                # Try to parse as JSON, handle raw NMEA strings if parsing fails
                try:
                    message = json.loads(message_value)
                    
                    # Handle JSON messages (from your producer or batched messages)
                    if isinstance(message, list):
                        # It's a batch of messages
                        print(f"Processing batch of {len(message)} messages")
                        for item in message:
                            process_vessel_data(item, ships, socket_client)
                    elif isinstance(message, dict):
                        # It's a single message
                        await process_vessel_data(message, ships, socket_client)
                    else:
                        print(f"Unexpected message format: {type(message)}")
                        
                except json.JSONDecodeError:
                    # It might be a raw NMEA string from antenna
                    print("Received raw NMEA data, forwarding as is")
                    await socket_client.send(message_value)
                    
            except Exception as e:
                print(f"Error processing message: {e}")
    except Exception as e:
        print(f"Fatal error in consume_ais: {e}")
    finally:
        await consumer.stop()

async def process_vessel_data(message, ships, socket_client):
    """Process a single vessel data message and forward it to WebSocket if complete"""
    if "mmsi" in message:
        mmsi = message["mmsi"]
        if mmsi not in ships:
            ships[mmsi] = {}
        
        # Update our cached vessel info
        ships[mmsi].update(message)
        complete_vessel = ships[mmsi]
        
        # Send to WebSocket
        print(f"Sending vessel data for MMSI {mmsi} to WebSocket")
        success = await socket_client.send(json.dumps(complete_vessel))
        
        if not success:
            print(f"Failed to send vessel data for {mmsi} to WebSocket")
    else:
        # Message doesn't have MMSI, send as is
        print("Received message without MMSI, sending as is")
        await socket_client.send(json.dumps(message))

async def main():
    try:
        with open(BROKER_INFO_RELATIVE_PATH, "r") as file:
            broker_info = json.load(file)
    except FileNotFoundError:
        print(f"Could not find broker info at {BROKER_INFO_RELATIVE_PATH}")
        return
    except json.JSONDecodeError:
        print(f"Invalid JSON in broker info file")
        return

    broker_ip = broker_info["ip"]
    broker_port = broker_info["port"]
    broker_topic = "ais-log"
    
    print(f"Connecting to Kafka broker: {broker_ip}:{broker_port}")
    print(f"Subscribing to topic: {broker_topic}")

    socket_client = WebSocketClient("ws://localhost:8766?client_name=map_client")

    while True:
        consumer = None
        ws_connected = False
        
        try:
            # Connect to WebSocket first
            print("Connecting to WebSocket...")
            ws_connected = await socket_client.connect()
            if not ws_connected:
                print("Failed to connect to WebSocket, retrying in 5s...")
                await asyncio.sleep(5)
                continue
            
            # Then create and start Kafka consumer
            print("Creating Kafka consumer...")
            consumer = AIOKafkaConsumer(
                broker_topic,
                bootstrap_servers=[f"{broker_ip}:{broker_port}"],
                auto_offset_reset='latest',
                group_id='ais-consumer-group',
                enable_auto_commit=True,
                value_deserializer=lambda v: v  # Keep raw value for flexible handling
            )
            
            print("Starting consumer process...")
            await consume_ais(consumer, socket_client)
            
        except Exception as e:
            print(f"Error in main loop: {e}, restarting in 5s...")
        finally:
            # Clean up resources
            if consumer:
                try:
                    await consumer.stop()
                except Exception as e:
                    print(f"Error stopping consumer: {e}")
            
            if ws_connected:
                try:
                    await socket_client.close()
                except Exception as e:
                    print(f"Error closing WebSocket: {e}")
        
        await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())