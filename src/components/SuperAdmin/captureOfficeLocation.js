import { readCurrentLocation } from '../../services/currentLocation.js';
// Capture only on an explicit form action. This function never saves an office.
export async function captureOfficeLocation({ geolocation, readConnection, includeGPS = true, includeNetwork = true, signal }) {
  const location = !includeGPS ? Promise.resolve(null) : readCurrentLocation({ geolocation, signal, maximumAccuracy: 15 }).then(sample => ({ latitude: sample.latitude.toFixed(6), longitude: sample.longitude.toFixed(6), accuracy: sample.accuracy }));
  const connection = !includeNetwork ? Promise.resolve(null) : Promise.resolve().then(() => readConnection(signal)).then(response => {
    if (!response.success || !response.data?.connection_ip) throw new Error(response.error || 'Could not detect the current connection IP. Retry or enter office IPs manually.');
    return response.data.connection_ip;
  });
  const [gps, network] = await Promise.allSettled([location, connection]);
  return {
    coordinates: gps.status === 'fulfilled' ? gps.value : null,
    ip: network.status === 'fulfilled' ? network.value : null,
    errors: [gps, network].filter(result => result.status === 'rejected').map(result => result.reason?.name === 'AbortError' ? 'Location capture cancelled or timed out. Please try again.' : result.reason.message),
  };
}
