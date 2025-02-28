export const getHaversineDistance = (lat1, lng1, lat2, lng2) => {
    const earthRadius = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180.0;
    const dLng = (lng2 - lng1) * Math.PI / 180.0;

    lat1 = (lat1) * Math.PI / 180.0;
    lat2 = (lat2) * Math.PI / 180.0;

    const halfChordSquared = Math.pow(Math.sin(dLat / 2), 2) +
    Math.pow(Math.sin(dLng / 2), 2) *
    Math.cos(lat1) * Math.cos(lat2);
    const angularDistance = 2 * Math.asin(Math.sqrt(halfChordSquared));

    const haversineDistance = earthRadius * angularDistance;

    return haversineDistance;
  }