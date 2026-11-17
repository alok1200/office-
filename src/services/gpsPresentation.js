const validNumber = value => value !== null && value !== undefined && String(value).trim() !== '' && Number.isFinite(Number(value));
export function mapPoint(latitude, longitude) {
  if (!validNumber(latitude) || !validNumber(longitude) || Math.abs(Number(latitude)) > 90 || Math.abs(Number(longitude)) > 180) return null;
  return [Number(latitude), Number(longitude)];
}

// Quality represents reported coordinate accuracy, not measured radio signal strength.
export function gpsQuality(sample, maximumAccuracy = 50) {
  const limit = Math.min(Number(maximumAccuracy), 50);
  if (!sample || !mapPoint(sample.latitude, sample.longitude) || typeof sample.accuracy !== 'number' || !Number.isFinite(sample.accuracy) || sample.accuracy < 0 || !Number.isFinite(limit) || limit <= 0) return { bars: 0, label: 'Unknown', precise: false };
  if (sample.accuracy > limit) return { bars: 1, label: 'Unverified', precise: false };
  return { bars: sample.accuracy <= Math.min(5, limit) ? 3 : sample.accuracy <= 15 ? 2 : 1, label: sample.accuracy <= 15 ? 'Precise fix' : 'Accepted accuracy', precise: true };
}

export function formatGpsDistance(metres) {
  if (typeof metres !== 'number' || !Number.isFinite(metres) || metres < 0) return '—';
  if (metres < 100) return `${metres.toFixed(2)} m`;
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toLocaleString('en-IN', { maximumFractionDigits: 1 })} km`;
}
