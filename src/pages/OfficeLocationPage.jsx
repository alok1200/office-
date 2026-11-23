import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ATTENDANCE_RADIUS_M } from '../services/geofenceStatus';
import { api } from '../services/api';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export function OfficeLocationPage() {
  const { currentUserId, isSuperAdmin } = useAuth();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load existing office location on mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await api.getOfficeLocation();
        if (res.success && res.data) {
          setLocation(res.data);
        }
      } catch (e) {
        setError('Failed to load office location');
      } finally {
        setLoading(false);
      }
    };
    fetchLocation();
  }, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLocation({
          latitude,
          longitude,
          radius_m: ATTENDANCE_RADIUS_M,
          max_accuracy_m: 20,
          address: '',
        });
        if (accuracy > 20) {
          setError('GPS accuracy is low. Move nearer to a window/outdoors.');
        } else {
          setError(null);
        }
      },
      () => setError('Unable to retrieve location')
    );
  };

  const saveLocation = async () => {
    if (!location) return;
    try {
      const res = await api.updateOfficeLocation(location);
      if (res.success) {
        setError(null);
        alert('Office location saved');
      } else {
        setError(res.error || 'Save failed');
      }
    } catch (e) {
      setError('Save failed');
    }
  };

  if (!isSuperAdmin) return null;

  return (
    <div className="space-y-6 bg-white text-black p-6">
      <h2 className="text-xl font-black text-black">Office GPS Location</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-4">
            <button
              onClick={useCurrentLocation}
              className="px-4 py-2 bg-white border border-blue-600 text-black rounded-xl text-sm font-semibold hover:bg-blue-50"
            >
              Use My Current Location
            </button>
            <button
              onClick={saveLocation}
              className="px-4 py-2 bg-white border border-blue-600 text-black rounded-xl text-sm font-semibold hover:bg-blue-50"
            >
              Save Location
            </button>
          </div>
          {location && (
            <div style={{ height: '300px' }} className="border rounded">
              <MapContainer
                center={[location.latitude, location.longitude]}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[location.latitude, location.longitude]} />
                <Circle
                  center={[location.latitude, location.longitude]}
                  radius={ATTENDANCE_RADIUS_M}
                  pathOptions={{ color: 'blue', fillOpacity: 0.1 }}
                />
              </MapContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
