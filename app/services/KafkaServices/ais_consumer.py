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

BROKER_INFO_RELATIVE_PATH = '../../configs/broker_info.json'

async def consume_ais(consumer: AIOKafkaConsumer, socket_client: WebSocketClient):
    ships = {}
    await consumer.start()

    try:
        async for msg in consumer:
            try:
                message = json.loads(msg.value)
                
                if "mmsi" in message:
                    mmsi = message["mmsi"]
                    if mmsi not in ships:
                        ships[mmsi] = {}
                    ships[mmsi].update(message)
                    complete_vessel = ships[mmsi]
                    
                    success = await socket_client.send(json.dumps(complete_vessel))
                    
                    if not success:
                        print(f"Failed to send vessel data for {mmsi} to WebSocket")
                else:
                    print("Received message without MMSI, sending as is")
                    success = await socket_client.send(msg.value)
                    
            except Exception as e:
                print(f"Error processing message: {e}")
    except Exception as e:
        print(f"Fatal error in consume_ais: {e}")
    finally:
        await consumer.stop()
        await socket_client.close()

async def main():

    with open(BROKER_INFO_RELATIVE_PATH, "r") as file:
        broker_info = json.load(file)

    broker_ip = broker_info["ip"]
    broker_port = broker_info["port"]
    broker_topic = "ais-log"

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