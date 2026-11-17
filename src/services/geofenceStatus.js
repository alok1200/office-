export function evaluateLocation(office, sample) {
  if (!office) return { eligible: false, message: 'Your office has not been configured.' };
  office = { ...office, radius_m: Number(office.radius_m) > 0 ? 50 : office.radius_m, max_accuracy_m: Math.min(Number(office.max_accuracy_m ?? 50), 50) };
  if ([office.latitude, office.longitude, office.radius_m, office.max_accuracy_m ?? 50].some(value => value === null || value === '' || !Number.isFinite(Number(value))) || Math.abs(Number(office.latitude)) > 90 || Math.abs(Number(office.longitude)) > 180 || Number(office.radius_m) <= 0 || Number(office.max_accuracy_m ?? 50) <= 0) return { eligible: false, message: 'Office GPS settings are invalid. Contact your administrator.' };
  if (!sample || !Number.isFinite(sample.latitude) || !Number.isFinite(sample.longitude) || Math.abs(sample.latitude) > 90 || Math.abs(sample.longitude) > 180 || !Number.isFinite(sample.accuracy) || sample.accuracy < 0) return { eligible: false, message: 'Check your current location to enable attendance actions.' };
  const radians = value => value * Math.PI / 180;
  const a = Math.sin(radians(sample.latitude - Number(office.latitude)) / 2) ** 2 + Math.cos(radians(sample.latitude)) * Math.cos(radians(Number(office.latitude))) * Math.sin(radians(sample.longitude - Number(office.longitude)) / 2) ** 2;
  const distance = 6371000 * 2 * Math.atan2(Math.sqrt(Math.min(1, Math.max(0, a))), Math.sqrt(1 - Math.min(1, Math.max(0, a))));
  if (sample.accuracy > Number(office.max_accuracy_m ?? 50)) return { eligible: false, distance, message: `GPS accuracy ±${Math.round(sample.accuracy)} m is too low. Required: ±${office.max_accuracy_m ?? 50} m or better.` };
  const inside = distance <= Number(office.radius_m);
  return { eligible: inside, distance, message: inside ? `Inside the saved office radius (${office.radius_m} m).` : `Outside office radius: ${distance < 100 ? distance.toFixed(2) : Math.round(distance)} m away; allowed ${office.radius_m} m.` };
}
