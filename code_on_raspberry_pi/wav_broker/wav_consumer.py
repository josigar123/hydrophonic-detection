from kafka import KafkaConsumer
import websockets
import asyncio
import json
from aiokafka import AIOKafkaConsumer

'''

This file subscribes to an audio-stream topic on a kafka broker
hosted on the raspberry pi, and consumes data

Consumer must:
First: recieve the wav-data from the broker, that the producer pushes,
Second: for each message received from the broker, have a ws connection where the 
        data is sent to, 

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
                    break
                except Exception as e:
                    if seconds >= 30:
                        print(f"WebSocket connection could not be established, exiting...")
                        break;
                    print(f"WebSocket connection failed: {e}, retrying in {seconds}s...")
                    await asyncio.sleep(seconds)
                    seconds += 1
    
    async def send(self, data):
        await self.connect()
        await self.websocket.send(data)
    
    async def close(self):
        if self.websocket:
            await self.websocket.close()
            self.websocket = None

with open("broker_info.json", "r") as file:
    broker_info = json.load(file)

broker_ip = broker_info["ip"]
broker_port = broker_info["brokerPort"]
broker_topic = broker_info["topicName"]



async def consume_audio(consumer: AIOKafkaConsumer, socket_client: WebSocketClient):
    while True:
        try:
            await consumer.start()
            async for msg in consumer:
                print("consumed: ", msg.topic, msg.partition, msg.offset,
                    msg.key, msg.value, msg.timestamp)
                print("Sending message value to websocket")
                await socket_client.send(msg.value)
        except Exception as e:
            print(f"Error in consume_audio: {e}, retrying in 5s...")
            await asyncio.sleep(5)
        finally:
            await socket_client.close()
            await consumer.stop()

async def main():
    socket_client = WebSocketClient("ws://localhost:8766")
    async_audio_consumer = AIOKafkaConsumer(
        broker_topic,
        bootstrap_servers=[f"{broker_ip}:{broker_port}"],
        auto_offset_reset='latest',
        enable_auto_commit=True
    )

    await consume_audio(async_audio_consumer, socket_client)

if __name__ == "__main__":
    asyncio.run(main())