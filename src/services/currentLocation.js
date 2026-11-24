// Read real device coordinates; never substitute the office pin or an IP location.
export function readCurrentLocation({ geolocation = globalThis.navigator?.geolocation, signal, maximumAccuracy = 50, targetAccuracy = 15, timeoutMs = 20000, graceMs = 1200, canFinishEarly = () => true, onProgress, secureContext = globalThis.isSecureContext } = {}) {
  return new Promise((resolve, reject) => {
    const failure = (message, code = 'GPS_UNAVAILABLE') => Object.assign(new Error(message), { code });
    if (secureContext === false) { reject(failure('Location requires HTTPS or localhost. Open the app on a secure connection and retry.', 'GPS_INSECURE_CONTEXT')); return; }
    if (!geolocation) { reject(failure('GPS is unavailable in this browser. Enable device Location Services and use a supported browser.')); return; }
    let settled = false, watchId, timer, graceTimer, kickTimer, best;
    const finish = (error, sample) => {
      if (settled) return;
      settled = true; clearTimeout(timer); clearTimeout(graceTimer); clearTimeout(kickTimer);
      if (watchId !== undefined) geolocation.clearWatch?.(watchId);
      signal?.removeEventListener('abort', aborted);
      globalThis.document?.removeEventListener('visibilitychange', visibilityChanged);
      if (error) reject(error); else resolve(sample);
    };
    const aborted = () => finish(Object.assign(new Error('Location check cancelled. Keep this page open and try again.'), { name: 'AbortError' }));
    const visibilityChanged = () => { if (globalThis.document.visibilityState !== 'visible') aborted(); };
    if (signal?.aborted) { aborted(); return; }
    signal?.addEventListener('abort', aborted, { once: true });
    globalThis.document?.addEventListener('visibilitychange', visibilityChanged);
    const timedOut = () => {
      // Try for a precise fix first; a fresh best fix may still satisfy the office's separate accuracy allowance.
      if (best && Date.now() - best.readAt <= Math.min(timeoutMs + 1000, 30000) && best.accuracy <= maximumAccuracy) { finish(null, best); return; }
      finish(best ? failure(`GPS accuracy is ±${Math.round(best.accuracy)} m; ±${maximumAccuracy} m or better is required. Enable precise location, move near a window or outdoors, and retry.`, 'LOW_ACCURACY') : failure('GPS timed out without a fresh position. Enable device Location Services and precise location, then retry near a window or outdoors.', 'GPS_TIMEOUT'));
    };
    timer = setTimeout(timedOut, timeoutMs);
    const success = position => {
      if (settled) return;
      const { latitude, longitude, accuracy } = position?.coords || {};
      if (![latitude, longitude, accuracy].every(Number.isFinite) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || accuracy < 0) {
        if (typeof geolocation.watchPosition !== 'function') finish(failure('GPS returned an invalid reading. Please retry.'));
        return;
      }
      // Reject genuinely stale cached fixes (>30s old) while tolerating stationary OS fixes and minor clock skew.
      const now = Date.now();
      const timestamp = position.timestamp ?? now;
      if (!Number.isFinite(timestamp) || now - timestamp > 30000 || timestamp - now > 5000) return;
      const sample = { latitude, longitude, accuracy, readAt: Math.min(timestamp, now) };
      if (!best || sample.accuracy <= best.accuracy) {
        best = sample;
        onProgress?.(best);
      }
      if (best.accuracy <= maximumAccuracy && canFinishEarly(best)) {
        if (best.accuracy <= targetAccuracy) finish(null, best);
        else if (!graceTimer) {
          graceTimer = setTimeout(() => {
            graceTimer = undefined;
            if (canFinishEarly(best)) finish(null, best);
          }, graceMs);
        }
      } else if (typeof geolocation.watchPosition !== 'function') timedOut();
    };
    let kickedFallback = false;
    const triggerFallback = () => {
      if (settled || kickedFallback || typeof geolocation.getCurrentPosition !== 'function') return;
      if (best && best.accuracy <= maximumAccuracy && canFinishEarly(best)) return;
      kickedFallback = true;
      try {
        // Ask for a fresh fix if the watch has not produced a usable reading.
        geolocation.getCurrentPosition(success, err => {
          if (err?.code === 1) failed(err);
        }, { enableHighAccuracy: true, maximumAge: 0, timeout: Math.max(4000, timeoutMs - 3000) });
      } catch { /* watchPosition remains active */ }
    };
    const failed = error => {
      if (settled) return;
      if (error.code === 1) finish(failure('Location permission denied. Allow Location in your browser’s site settings and turn on Location Services and precise location on your device, then try again.', 'GPS_PERMISSION_DENIED'));
      else if (typeof geolocation.watchPosition !== 'function') finish(failure(error.code === 3 ? 'GPS timed out. Enable Location Services and retry outdoors or near a window.' : 'GPS is unavailable. Enable Location Services and precise location, then retry.', error.code === 3 ? 'GPS_TIMEOUT' : 'GPS_UNAVAILABLE'));
      else triggerFallback();
      // A temporary unavailable/timeout update can be followed by a better fix.
    };
    const options = { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs };
    try {
      if (typeof geolocation.watchPosition === 'function') {
        watchId = geolocation.watchPosition(success, failed, options);
        // Also handles synchronous test/browser callbacks before the ID is assigned.
        if (settled && watchId !== undefined) geolocation.clearWatch?.(watchId);
        else if (typeof geolocation.getCurrentPosition === 'function') {
          kickTimer = setTimeout(triggerFallback, Math.min(3500, Math.floor(timeoutMs / 3)));
        }
      } else geolocation.getCurrentPosition(success, failed, options);
    } catch { finish(failure('Location access is blocked. Check site permissions and use HTTPS or localhost.')); }
  });
}
