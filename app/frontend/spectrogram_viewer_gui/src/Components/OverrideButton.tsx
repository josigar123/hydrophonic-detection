import { useState, useEffect } from 'react';
import { Button, Tooltip } from '@heroui/react';

interface OverrideButtonProps {
  recordingStatus: boolean;
  isMonitoring: boolean;
}

const OverrideButton = ({
  recordingStatus,
  isMonitoring,
}: OverrideButtonProps) => {
  const [overrideActive, setOverrideActive] = useState<boolean>(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Only conntect to the socket if we are monitoring
  useEffect(() => {
    if (!isMonitoring) return;
    const ws = new WebSocket('ws://localhost:8766?client_name=override_client');

    ws.onmessage = (event: MessageEvent) => {
      try {
        const response = JSON.parse(event.data);

        if (response.status === 'delivered') {
          console.log(
            `Override ${response.value ? 'enabled' : 'disabled'} successfully`
          );
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
  }, [isMonitoring]);

  const toggleOverride = (): void => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.log('WebSocket is not connected');
      return;
    }

    let newValue: boolean;
    if (recordingStatus) {
      // If we are already recording, then pressing the buttson should end it
      newValue = false;
    } else {
      newValue = !overrideActive;
    }

    try {
      const message = JSON.stringify({ value: newValue ? 1 : 0 });

      socket.send(message);
      setOverrideActive(newValue);
    } catch (error) {
      if (error instanceof Error) {
        console.log(`Error sending message: ${error.message}`);
      }
    }
  };

  useEffect(() => {
    setOverrideActive(recordingStatus);
  }, [recordingStatus]);

  return (
    <Tooltip content="Bypass detection mechanism and start/stop recording manually">
      <Button
        radius="sm"
        color={
          recordingStatus && isMonitoring && overrideActive
            ? 'danger'
            : 'warning'
        }
        onPress={() => toggleOverride()}
        isDisabled={!isMonitoring}
      >
        {recordingStatus && isMonitoring && overrideActive
          ? 'Stop Recording'
          : 'Manual Detection'}
      </Button>
    </Tooltip>
  );
};

export default OverrideButton;
