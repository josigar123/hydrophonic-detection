import asyncio
from aiokafka import AIOKafkaConsumer
from ServiceUtilities.websocket_client import  WebSocketClient
import os

'''

This file subscribes to an audio-stream topic on a kafka broker
hosted on the raspberry pi, and consumes data

Consumer must:
First: recieve the audio-data from the broker, that the producer pushes,
Second: for each message received from the broker, have a ws connection where the 
        data is sent to, 

MUST SUPPLY client_name query param when connecting to websocket

'''

async def consume_audio(consumer: AIOKafkaConsumer, socket_client: WebSocketClient):
    
    await consumer.start()

    try:
        async for msg in consumer:
            try:
                success = await socket_client.send(msg.value)
                if not success:
                    print("Failed to send message to WebSocket")
                    
            except Exception as e:
                print(f"Error processing message: {e}")
    except Exception as e:
        print(f"Fatal error in consume_audio: {e}")
    finally:
        await consumer.stop()
        await socket_client.close()

async def main():

    BOOTSTRAP_SERVERS = os.getenv("BOOTSTRAP_SERVERS") # 'ip:port'
    
    broker_topic = "audio-stream"

    socket_client = WebSocketClient("ws://localhost:8766?client_name=audio_consumer")

    while True:
        try:
            async_audio_consumer = AIOKafkaConsumer(
                broker_topic,
                bootstrap_servers=BOOTSTRAP_SERVERS,
                auto_offset_reset='latest',
                enable_auto_commit=True
            )

            success = await socket_client.connect()
            if not success:
                print("Failed to connect to WebSocket, retrying in 5s...")
                await asyncio.sleep(5)
                continue

            await consume_audio(async_audio_consumer, socket_client)
        except Exception as e:
            print(f"Error in main loop: {e}, restarting in 5s...")
        
        await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())