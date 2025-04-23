import { useContext, useState, useEffect, Fragment } from 'react';
import { Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { DetectionContext } from '../Contexts/DetectionContext';
import { BroadbandDetections } from '../Interfaces/Payloads';

const hydroPhoneIcon = new L.Icon({
  iconUrl: '/assets/icons/hydrophone.svg',
  iconSize: [50, 50],
  iconAnchor: [25, 25],
  popupAnchor: [0, -10],
  className: 'hydrophone-icon',
});

type ChannelId = 'channel1' | 'channel2' | 'channel3' | 'channel4';

const HYDROPHONES = [
  {
    "id": "hp1",
    "latitude": 59.428493127821774,
    "longitude": 10.465132005497228,
    "channel": "channel1"
  },
  {
    "id": "hp2",
    "latitude": 59.42846584366684,
    "longitude": 10.465282224072247,
    "channel": "channel2"
  },
  {
    "id": "hp3",
    "latitude": 59.428441287908576,
    "longitude": 10.465400226398717,
    "channel": "channel3"
  }
];

// Radiation effect component for active hydrophones
const RadiationEffect = ({ position }: { position: [number, number] }) => {
  const [radius, setRadius] = useState(1);
  const [opacity, setOpacity] = useState(0.8);

  useEffect(() => {
    const interval = setInterval(() => {
      setRadius((prev) => (prev < 8 ? prev + 1 : 8));
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

export function HydrophoneMarker() {
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
