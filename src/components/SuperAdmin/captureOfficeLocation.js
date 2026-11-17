// Capture only on an explicit form action. This function never saves an office.
export async function captureOfficeLocation({ geolocation, readConnection, includeGPS = true, includeNetwork = true, signal }) {
  const location = !includeGPS ? Promise.resolve(null) : !geolocation ? Promise.reject(new Error('GPS is unavailable in this browser. Enter coordinates manually.')) : new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(position => {
      const { latitude, longitude, accuracy } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || !Number.isFinite(accuracy) || accuracy < 0) {
        reject(new Error('GPS returned an invalid reading. Try again or enter coordinates manually.')); return;
      }
      resolve({ latitude: latitude.toFixed(6), longitude: longitude.toFixed(6), accuracy });
    }, error => reject(new Error(error.code === 1 ? 'Location permission denied. Allow location access or enter coordinates manually.' : 'Could not read your GPS position. Try again or enter coordinates manually.')), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });
  const connection = !includeNetwork ? Promise.resolve(null) : Promise.resolve().then(() => readConnection(signal)).then(response => {
    if (!response.success || !response.data?.connection_ip) throw new Error(response.error || 'Could not detect the current connection IP. Retry or enter office IPs manually.');
    return response.data.connection_ip;
  });
  const [gps, network] = await Promise.allSettled([location, connection]);
  return {
    coordinates: gps.status === 'fulfilled' ? gps.value : null,
    ip: network.status === 'fulfilled' ? network.value : null,
    errors: [gps, network].filter(result => result.status === 'rejected').map(result => result.reason?.name === 'AbortError' ? 'IP detection timed out. Please try again.' : result.reason.message),
  };
}
