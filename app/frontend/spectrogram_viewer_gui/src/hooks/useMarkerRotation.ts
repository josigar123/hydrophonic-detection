import "leaflet-rotatedmarker";
import { useEffect } from "react";
import L from "leaflet";


export default function useMarkerRotation(
  marker: L.Marker | null,
  rotationAngle: number,
  rotationOrigin: string = "center"
) {
  useEffect(() => {
    if (marker) {
      marker.setRotationAngle(rotationAngle);
      marker.setRotationOrigin(rotationOrigin);
    }
  }, [marker, rotationAngle, rotationOrigin]);
}
