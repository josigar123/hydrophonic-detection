import asyncio
import json
import uuid
from datetime import datetime
from aiokafka import AIOKafkaProducer
import websockets
from audio_event_recorder import AudioEventRecorder

class EventTriggerService:
    def __init__(self, broker_info_file="broker_info.json"):
        with open(broker_info_file, "r") as file:
            self.broker_info = json.load(file)
        
        self.events_topic = "detection-events"  
        self.producer = None
    
    async def init_producer(self):
        self.producer = AIOKafkaProducer(
            bootstrap_servers=f"{self.broker_info['ip']}:{self.broker_info['brokerPort']}",
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        await self.producer.start()
        print(f"Kafka producer initialized, connected to {self.broker_info['ip']}:{self.broker_info['brokerPort']}")
    
    async def close(self):
        if self.producer:
            await self.producer.stop()
            print("Kafka producer closed")
    
    async def trigger_event(self, event_id=None, threshold_reached=True, metadata=None):
        if not self.producer:
            await self.init_producer()
        
        if not event_id:
            event_id = str(uuid.uuid4())
        
        event = {
            "event_id": event_id,
            "timestamp": datetime.now().isoformat(),
            "threshold_reached": threshold_reached
        }
        
        if metadata:
            event.update(metadata)
        
        await self.producer.send_and_wait(self.events_topic, event)
        
        status = "start" if threshold_reached else "stop"
        print(f"Sent {status} event trigger: {event_id}")
        
        return event_id

async def handle_trigger_websocket(websocket, path, trigger_service, recorder):
    print(f"New WebSocket connection from {websocket.remote_address}")
    
    active_events = {}
    
    try:
        async for message in websocket:
            try:
                command = json.loads(message)
                action = command.get("action")
                
                if action == "trigger_event":
                    threshold_reached = command.get("threshold_reached", True)
                    event_id = command.get("event_id")
                    
                    if threshold_reached and not event_id:
                        event_id = str(uuid.uuid4())
                    
                    if not threshold_reached and not event_id:
                        await websocket.send(json.dumps({
                            "status": "error", 
                            "message": "event_id required for threshold_reached=false"
                        }))
                        continue
                    
                    event_id = await trigger_service.trigger_event(
                        event_id=event_id,
                        threshold_reached=threshold_reached,
                        metadata=command.get("metadata")
                    )
                    

                    if threshold_reached:
                        active_events[event_id] = True
                    else:
                        active_events.pop(event_id, None)
                    

                    await websocket.send(json.dumps({
                        "status": "success", 
                        "event_id": event_id,
                        "action": "start" if threshold_reached else "stop"
                    }))
                
                elif action == "get_active_events":
                    await websocket.send(json.dumps({
                        "status": "success",
                        "active_events": list(active_events.keys())
                    }))

                elif action == "end_session":
                    session_id = await recorder.end_recording_session()
                    await websocket.send(json.dumps({
                        "status": "success",
                        "action": "end_session",
                        "session_id": session_id
                    }))
                
                else:
                    await websocket.send(json.dumps({
                        "status": "error", 
                        "message": "Unknown action"
                    }))
            
            except json.JSONDecodeError:
                await websocket.send(json.dumps({
                    "status": "error", 
                    "message": "Invalid JSON"
                }))
            except Exception as e:
                await websocket.send(json.dumps({
                    "status": "error", 
                    "message": str(e)
                }))
    
    except websockets.exceptions.ConnectionClosed:
        print(f"WebSocket connection closed from {websocket.remote_address}")

async def main():
    trigger_service = EventTriggerService()

    recorder = AudioEventRecorder()
    
    async def ws_handler(websocket, path):
        await handle_trigger_websocket(websocket, path, trigger_service, recorder)
    
    server = await websockets.serve(
        ws_handler,
        "localhost",
        8767, 
        ping_interval=30,
        ping_timeout=10
    )
    
    print("Event trigger WebSocket server running on ws://localhost:8767")
    
    await asyncio.Future()
    
    await trigger_service.close()

if __name__ == "__main__":
    asyncio.run(main())