import { useContext, useState, useEffect, Fragment } from 'react';
import { Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { DetectionContext } from '../Contexts/DetectionContext';
import { BroadbandDetections } from '../Interfaces/Payloads';

const hydroPhoneIcon = new L.Icon({
  iconUrl: '/assets/icons/hydrophone.svg',
  iconSize: [50, 50],
  iconAnchor: [15, 15],
  popupAnchor: [0, -10],
  className: 'hydrophone-icon',
});

interface HydrophoneMarkerProps {
  isMonitoring: boolean;
}

type ChannelId = 'channel1' | 'channel2' | 'channel3' | 'channel4';

const HYDROPHONES = [
  {
    id: 'hp1',
    latitude: 59.42854224286619,
    longitude: 10.465024672526075,
    channel: 'channel1' as ChannelId,
  },
  {
    id: 'hp2',
    latitude: 59.42852041557567,
    longitude: 10.465164139959759,
    channel: 'channel2' as ChannelId,
  },
  {
    id: 'hp3',
    latitude: 59.428506773511955,
    longitude: 10.465282186896783,
    channel: 'channel3' as ChannelId,
  },
  {
    id: 'hp4',
    latitude: 59.428490403028235,
    longitude: 10.4654001446127,
    channel: 'channel4' as ChannelId,
  },
];

// Radiation effect component for active hydrophones
const RadiationEffect = ({ position }: { position: [number, number] }) => {
  const [radius, setRadius] = useState(20);
  const [opacity, setOpacity] = useState(0.8);

  useEffect(() => {
    const interval = setInterval(() => {
      setRadius((prev) => (prev < 100 ? prev + 5 : 20));
      setOpacity((prev) => (prev > 0.1 ? prev - 0.03 : 0.8));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <Circle
      center={position}
      radius={radius}
      pathOptions={{
        color: '#ff3b00',
        fillColor: '#ff3b00',
        fillOpacity: opacity,
        weight: 2,
      }}
    />
  );
};

export function HydrophoneMarker({ isMonitoring }: HydrophoneMarkerProps) {
  const context = useContext(DetectionContext);
  if (!context) return null;

  return (
    <>
      {HYDROPHONES.map(({ id, latitude, longitude, channel }) => {
        const isActive =
          context.detection?.broadbandDetections?.detections?.[
            channel as keyof BroadbandDetections['detections']
          ];

        return (
          <Fragment key={id}>
            <Marker position={[latitude, longitude]} icon={hydroPhoneIcon}>
              <Popup>
                <div>
                  <h4>Hydrophone {id}</h4>
                  <p>
                    Status: <strong>{isActive ? 'DETECTED' : 'Idle'}</strong>
                  </p>
                </div>
              </Popup>
            </Marker>

            {isActive && <RadiationEffect position={[latitude, longitude]} />}
          </Fragment>
        );
      })}
    </>
  );
}
