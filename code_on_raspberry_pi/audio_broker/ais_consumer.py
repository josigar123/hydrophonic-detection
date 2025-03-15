import websockets
import asyncio
import json
from datetime import datetime
from aiokafka import AIOKafkaConsumer
from mongodb_handler import MongoDBHandler 

with open("mongodb_config.json", "r") as file:
    mongo_config = json.load(file)


db_handler = MongoDBHandler(
    connection_string=mongo_config["connection_string"],
    db_name=mongo_config["database"]
)
'''

This file subscribes to an ais-stream topic on a kafka broker
hosted on the raspberry pi, and consumes data

Consumer must:
First: recieve the ais-data from the broker, that the producer pushes,
Second: for each message received from the broker, have a ws connection where the 
        data is sent to, 

MUST SUPPLY client_name query param when connecting to websocket

'''

class WebSocketClient:

    def __init__(self, url):
        self.url = url
        self.websocket = None
    
    async def connect(self):
        seconds: int = 1
        if self.websocket == None or  self.websocket.closed:
            while True:
                try:
                    self.websocket = await websockets.connect(self.url)
                    print(f"Successfully connected to WebSocket at {self.url}")
                    return True
                except Exception as e:
                    if seconds >= 30:
                        print(f"WebSocket connection could not be established, exiting...")
                        return False
                    print(f"WebSocket connection failed: {e}, retrying in {seconds}s...")
                    await asyncio.sleep(seconds)
                    seconds += 1
    
    async def send(self, data):
        if self.websocket is None or self.websocket.closed:
            success = await self.connect()
            if not success:
                return False
        
        try:
            await self.websocket.send(data)
            return True
        except websockets.exceptions.ConnectionClosed:
            print("Connection closed while sending data. Will reconnect on next attempt...")
            self.websocket = None
            return False
        except Exception as e:
            print(f"Error sending data: {e}")
            return False
        
    async def close(self):
        if self.websocket:
            await self.websocket.close()
            self.websocket = None

async def consume_ais(consumer: AIOKafkaConsumer, socket_client: WebSocketClient):
    
    await consumer.start()

    try:
        async for msg in consumer:
            try:
                print(f"Consumed message, offset: {msg.offset}")

                success = await socket_client.send(msg.value)
                if success:
                    print("Successfully sent message to websocket")
                else:
                    print("Failed to send message to WebSocket")
            except Exception as e:
                print(f"Error processing message: {e}")
    except Exception as e:
        print(f"Fatal error in consume_ais: {e}")
    finally:
        await consumer.stop()
        await socket_client.close()

async def main():

    with open("broker_info_ais.json", "r") as file:
        broker_info = json.load(file)

    broker_ip = broker_info["ip"]
    broker_port = broker_info["brokerPort"]
    broker_topic = broker_info["topicName"]

    socket_client = WebSocketClient("ws://localhost:8766?client_name=ais_consumer")

    while True:
        try:
            async_ais_consumer = AIOKafkaConsumer(
                broker_topic,
                bootstrap_servers=[f"{broker_ip}:{broker_port}"],
                auto_offset_reset='latest',
                enable_auto_commit=True
            )

            success = await socket_client.connect()
            if not success:
                print("Failed to connect to WebSocket, retrying in 5s...")
                await asyncio.sleep(5)
                continue

            await consume_ais(async_ais_consumer, socket_client)
        except Exception as e:
            print(f"Error in main loop: {e}, restarting in 5s...")
        
        await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())