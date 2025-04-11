import { useEffect, useState, useRef, useCallback } from 'react';

export function useRecordingStatus(url: string = 'ws://localhost:8766', autoConnect = false) {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const shouldConnectRef = useRef(autoConnect);

  
  const connect = useCallback(() => {
    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    
    setError(null);
    
    try {
      const wsUrl = `${url}?client_name=status_client`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      socket.onopen = () => {
        console.log('Connected to recording status websocket:', wsUrl);
        setIsConnected(true);
        setError(null);
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if ('value' in data) {
            const recordingStatus = Boolean(data.value);
            setIsRecording(recordingStatus);
            
            console.log(`Recording status updated: ${recordingStatus}`);
          }
        } catch (error) {
          console.error('Error parsing message in useRecordingStatus:', error);
          setError('Error parsing message in useRecordingStatus');
        }
      };
      
      socket.onclose = (event) => {
        console.log(
          `Disconnected from recording status server. Code: ${event.code}, Reason: ${event.reason}`
        );
        setIsConnected(false);
        socketRef.current = null;
        
        if (shouldConnectRef.current) {
          console.log('Attempting to reconnect in 3 seconds...');
          setTimeout(() => {
            if (shouldConnectRef.current) {
              connect();
            }
          }, 3000);
        }
      };
      
      socket.onerror = (event) => {
        console.error('Recording status WebSocket error:', event);
        setError('Recording status WebSocket connection error');
      };
    } catch (error) {
      console.error('Error creating recording status WebSocket:', error);
      setError('Failed to create recording status WebSocket connection');
    }
  }, [url]);
  
  const disconnect = useCallback(() => {
    shouldConnectRef.current = false;
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);
  
  useEffect(() => {
    if (autoConnect) {
      shouldConnectRef.current = true;
      connect();
    }
    
    return () => {
      if (socketRef.current) {
        console.log('Cleaning up recording status WebSocket connection');
        shouldConnectRef.current = false;
        socketRef.current.close();
      }
    };
  }, [autoConnect, connect]);
  
  return {
    isRecording,
    isConnected,
    error,
    connect,
    disconnect,
  };
}