import asyncio
import json
from datetime import datetime
from aiokafka import AIOKafkaConsumer
from websocket_client import  WebSocketClient
import multiprocessing


'''

This file subscribes to an ais-stream topic on a kafka broker
hosted on the raspberry pi, and consumes data

Consumer must:
First: recieve the ais-data from the broker, that the producer pushes,
Second: for each message received from the broker, have a ws connection where the 
        data is sent to, 

MUST SUPPLY client_name query param when connecting to websocket

'''

def run_ais_consumer(broker_info):
    asyncio.run(ais_consumer_loop(broker_info))

def consume_ais(broker_info: dict):
    consumer_process = multiprocessing.Process(target=run_ais_consumer, args=(broker_info,))
    consumer_process.start()
    return consumer_process

async def ais_consumer_loop(broker_info: dict):
    broker_ip = broker_info["ip"]
    broker_port = broker_info["port"]
    broker_topic = "ais-log"
    websocket_url = "ws://localhost:8766?client_name=ais_consumer"

    socket_client = WebSocketClient(websocket_url)

    while True:
        try:
            async_ais_consumer = AIOKafkaConsumer(
                broker_topic,
                bootstrap_servers=[f"{broker_ip}:{broker_port}"],
                auto_offset_reset="latest",
                enable_auto_commit=True
            )
            success = await socket_client.connect()
            if not success:
                print("Failed to connect to WebSocket, retrying in 5s...")
                await asyncio.sleep(5)
                continue
            await process_ais_messages(async_ais_consumer, socket_client)
        except Exception as e:
            print(f"Error in AIS consumer loop: {e}, restarting in 5s...")
            await asyncio.sleep(5)

async def process_ais_messages(consumer: AIOKafkaConsumer, socket_client: WebSocketClient):
    
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

    with open("broker_info.json", "r") as file:
        broker_info = json.load(file)

    await ais_consumer_loop(broker_info)
if __name__ == "__main__":
    asyncio.run(main())