export const ATTENDANCE_RADIUS_M = 100;
export const MAX_ATTENDANCE_ACCURACY_M = 100;
export const attendanceAccuracyLimit = value => Math.min(Number(value ?? 75), MAX_ATTENDANCE_ACCURACY_M);

const gpsFallbackMessages = {
  GPS_UNAVAILABLE: 'GPS could not provide a location.',
  GPS_TIMEOUT: 'GPS timed out without a fresh location.',
  GPS_PERMISSION_DENIED: 'Location permission was denied.',
  GPS_INSECURE_CONTEXT: 'This address does not allow GPS.',
  GPS_POLICY_BLOCKED: 'This page blocks GPS access.',
  GPS_REQUIRED: 'GPS did not provide a usable reading.',
  LOW_ACCURACY: 'GPS accuracy was too low.'
};

const attendanceRetryMessages = {
  GPS_UNAVAILABLE: 'Your location is unavailable. Turn on location services and try again.',
  GPS_TIMEOUT: 'Location verification timed out. Try again near a window or outdoors.',
  GPS_PERMISSION_DENIED: 'Allow location access for this site and try again.',
  GPS_INSECURE_CONTEXT: 'Open the secure attendance link and try again.',
  GPS_POLICY_BLOCKED: 'Open the attendance app directly in your browser and try again.',
  GPS_REQUIRED: 'Turn on precise location and try again.',
  LOW_ACCURACY: 'Try again near a window or outdoors so we can verify your location.',
  OUTSIDE_GEOFENCE: 'Your location appears outside the office. If you’re at work, try again or contact your attendance administrator.'
};

export function officeWifiMessage(office) {
  if (!office.wifi_attendance_enabled) return 'Office Wi-Fi attendance is turned off.';
  if (office.office_wifi_matched) return 'Office Wi-Fi matched.';
  if (office.office_lan_url) return 'Open the office Wi-Fi attendance link on this page and sign in there.';
  if (office.office_connection_type === 'PUBLIC' && office.office_connection_ip === null) return 'The hosted server could not verify your public IP. Contact your administrator.';
  if (office.office_connection_type === 'PUBLIC' && office.office_connection_ip) {
    const isIPv6 = office.office_connection_ip.includes(':');
    if (isIPv6 && office.office_public_ipv6_configured === false) return 'This device is using IPv6. Ask your Super Admin to register the office Wi-Fi’s public IPv6 subnet.';
    if (!isIPv6 && office.office_public_ip_configured === false) return 'Office Wi-Fi setup is incomplete. Contact your administrator.';
  }
  return 'Office Wi-Fi could not be verified.';
}

export function summarizeAttendanceCheck(office, gps) {
  const wifiMatched = office.wifi_attendance_enabled && office.office_wifi_matched;
  return {
    gps: {
      verified: Boolean(gps.eligible),
      message: gps.message
    },
    wifi: {
      verified: Boolean(wifiMatched),
      message: officeWifiMessage(office)
    },
    ready: Boolean(gps.eligible || wifiMatched)
  };
}

export function attendanceLocationFailure(office, { code, message }, { showWifiDiagnostics = true } = {}) {
  const gpsSummary = gpsFallbackMessages[code];
  if (!gpsSummary && code !== 'OUTSIDE_GEOFENCE') return { message };
  if (gpsSummary && office.wifi_attendance_enabled && office.office_wifi_matched) {
    const wifi = officeWifiMessage(office);
    return { fallback: true, gpsSummary, message: `${gpsSummary} ${wifi} You can record attendance using office Wi-Fi.` };
  }
  if (!showWifiDiagnostics) return { message: attendanceRetryMessages[code] };
  const wifi = officeWifiMessage(office);
  const wifiHelp = gpsSummary && office.wifi_attendance_enabled ? ' Connect to your registered office network and retry.' : '';
  return { message: `${message} ${wifi}${wifiHelp}` };
}

export function evaluateLocation(office, sample) {
  if (!office) return { eligible: false, message: 'Your office has not been configured.' };
  office = { ...office, radius_m: Number(office.radius_m) > 0 ? ATTENDANCE_RADIUS_M : office.radius_m, max_accuracy_m: attendanceAccuracyLimit(office.max_accuracy_m) };
  if ([office.latitude, office.longitude, office.radius_m, office.max_accuracy_m ?? 50].some(value => value === null || value === '' || !Number.isFinite(Number(value))) || Math.abs(Number(office.latitude)) > 90 || Math.abs(Number(office.longitude)) > 180 || Number(office.radius_m) <= 0 || Number(office.max_accuracy_m ?? 50) <= 0) return { eligible: false, message: 'Office GPS settings are invalid. Contact your administrator.' };
  if (!sample || !Number.isFinite(sample.latitude) || !Number.isFinite(sample.longitude) || Math.abs(sample.latitude) > 90 || Math.abs(sample.longitude) > 180 || !Number.isFinite(sample.accuracy) || sample.accuracy < 0) return { eligible: false, message: 'Check your current location to enable attendance actions.' };
  const radians = value => value * Math.PI / 180;
  const a = Math.sin(radians(sample.latitude - Number(office.latitude)) / 2) ** 2 + Math.cos(radians(sample.latitude)) * Math.cos(radians(Number(office.latitude))) * Math.sin(radians(sample.longitude - Number(office.longitude)) / 2) ** 2;
  const distance = 6371000 * 2 * Math.atan2(Math.sqrt(Math.min(1, Math.max(0, a))), Math.sqrt(1 - Math.min(1, Math.max(0, a))));
  if (sample.accuracy > Number(office.max_accuracy_m ?? 50)) return { eligible: false, code: 'LOW_ACCURACY', distance, message: `GPS accuracy ±${Math.round(sample.accuracy)} m is too low. Required: ±${office.max_accuracy_m ?? 50} m or better.` };
  const inside = distance <= Number(office.radius_m);
  const officeName = office.name || 'your saved office';
  const displayedDistance = distance < 1000 ? distance.toFixed(2) : Math.round(distance);
  const message = inside
    ? `You are within ${office.radius_m} m of ${officeName}.`
    : `Your GPS reading is ${displayedDistance} m from ${officeName}. Attendance requires being within ${office.radius_m} m. If you’re at the office, ask your administrator to verify your office assignment and the saved map pin.`;
  return { eligible: inside, code: inside ? undefined : 'OUTSIDE_GEOFENCE', distance, message };
}
