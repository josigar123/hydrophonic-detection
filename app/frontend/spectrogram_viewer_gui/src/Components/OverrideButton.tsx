import React, { useState, useEffect } from 'react';
import { Button } from '@heroui/react';


const OverrideButton: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [overrideActive, setOverrideActive] = useState<boolean>(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    console.log('Connecting to WebSocket...');
    const ws = new WebSocket('ws://localhost:8766?client_name=override_client');
    
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    };
    
    ws.onmessage = (event: MessageEvent) => {
      try {
        console.log(`Raw response: ${event.data}`);
        const response = JSON.parse(event.data);
        
        if (response.status === 'delivered') {
          console.log(`Override ${response.value ? 'enabled' : 'disabled'} successfully`);
        } else if (response.status === 'error') {
          console.log(`Server error: ${response.message}`);
        }
      } catch (error) {
        if (error instanceof Error) {
           console.log(`Error parsing response: ${error.message}`);
        }
      }
    };
    
    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
      setTimeout(() => setSocket(null), 3000);
    };
    
    ws.onerror = () => {
      console.log(`WebSocket error occurred`);
    };
    
    setSocket(ws);
    
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const toggleOverride = (): void => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.log('WebSocket is not connected');
      return;
    }
    
    const newValue = !overrideActive;
    
    try {
      const message = JSON.stringify({ value: newValue ? 1 : 0 });
      
      console.log(`Sending: ${message}`);
      socket.send(message);
      setOverrideActive(newValue);
      
    } catch (error) {
      if (error instanceof Error) {
        console.log(`Error sending message: ${error.message}`);
      }
    }
  };

  return (
    <Button
    color="primary"
    onPress={() => toggleOverride()}
  >
    Override
  </Button>
  )
};

export default OverrideButton;