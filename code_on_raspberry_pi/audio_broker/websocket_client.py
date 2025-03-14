import asyncio
import websockets

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