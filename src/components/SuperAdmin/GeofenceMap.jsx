import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, Marker, Circle, CircleMarker, Tooltip, ScaleControl, useMap, useMapEvents } from 'react-leaflet';
import { divIcon, latLng } from 'leaflet';
import { ATTENDANCE_RADIUS_M } from '../../services/geofenceStatus';
import { gpsQuality, mapPoint } from '../../services/gpsPresentation';
import 'leaflet/dist/leaflet.css';

const officeIcon = divIcon({ className: 'sa-map-office-icon', html: '<span></span>', iconSize: [20, 20], iconAnchor: [10, 10] });

function FitOfficeView({ officePoint, userPoint, accuracy, editable }) {
  const map = useMap();
  const officeLat = officePoint?.[0], officeLng = officePoint?.[1];
  const userLat = userPoint?.[0], userLng = userPoint?.[1];
  useEffect(() => {
    // Dialog/layout changes may finish after Leaflet first measures the container.
    const container = map.getContainer();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => map.invalidateSize({ pan: false })) : null;
    observer?.observe(container);
    const timer = setTimeout(() => map.invalidateSize({ pan: false }), 250);
    return () => { observer?.disconnect(); clearTimeout(timer); };
  }, [map]);
  useEffect(() => {
    if (officeLat === undefined || officeLng === undefined) return;
    if (editable) {
      // Moving a draft pin must not reset zoom or force a new view on each drag.
      if (map.getZoom() < 16 || !map.getBounds().contains([officeLat, officeLng])) map.setView([officeLat, officeLng], Math.max(map.getZoom(), 17), { animate: false });
      return;
    }
    const bounds = latLng(officeLat, officeLng).toBounds(ATTENDANCE_RADIUS_M * 2);
    if (userLat !== undefined && userLng !== undefined) bounds.extend(latLng(userLat, userLng).toBounds(Math.max(accuracy * 2, 10)));
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 19, animate: false });
  }, [map, officeLat, officeLng, userLat, userLng, accuracy, editable]);
  return null;
}
function PickOfficePoint({ onPick }) {
  useMapEvents({ click: event => onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng }) });
  return null;
}
export default function GeofenceMap({ office, sample, sampleAccuracyLimit = office?.max_accuracy_m ?? 50, onOfficePick, disabled = false }) {
  const [tileError, setTileError] = useState(false);
  const officePoint = mapPoint(office?.latitude, office?.longitude);
  const editable = typeof onOfficePick === 'function';
  const canPick = editable && !disabled;
  const precise = gpsQuality(sample, Number(sampleAccuracyLimit)).precise;
  const userPoint = precise ? mapPoint(sample.latitude, sample.longitude) : null;
  if (!officePoint && !editable) return <p className="sa-info">Save valid office coordinates to view the map.</p>;
  const tileEvents = { tileerror: () => setTileError(true), load: () => setTileError(false) };
  return <div className="sa-geographic-view">
    <div className={`sa-geographic-map ${canPick ? 'is-editable' : ''}`} role="region" aria-label={editable ? 'Choose the draft office location on the map' : 'Read-only map of the fixed office and accepted GPS position'}>
      <MapContainer center={officePoint || [20.5937, 78.9629]} zoom={officePoint ? 18 : 5} maxZoom={19} scrollWheelZoom={canPick} style={{ height: '100%', width: '100%' }}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Streets"><TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' maxZoom={19} eventHandlers={tileEvents} /></LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite"><TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='Imagery &copy; <a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9">Esri</a>, Vantor, Earthstar Geographics, GIS User Community' maxZoom={19} maxNativeZoom={18} eventHandlers={tileEvents} /></LayersControl.BaseLayer>
        </LayersControl>
        <FitOfficeView officePoint={officePoint} userPoint={userPoint} accuracy={precise ? sample.accuracy : 0} editable={editable} />
        {officePoint && <>
          <Circle center={officePoint} radius={ATTENDANCE_RADIUS_M} pathOptions={{ color: '#0560e8', fillColor: '#0560e8', fillOpacity: .1, weight: 2 }}><Tooltip>{editable ? 'Draft' : 'Fixed'} attendance boundary · {ATTENDANCE_RADIUS_M} m</Tooltip></Circle>
          {editable ? <Marker position={officePoint} icon={officeIcon} draggable={canPick} eventHandlers={{ dragend: event => { if (!canPick) return; const point = event.target.getLatLng(); onOfficePick({ latitude: point.lat, longitude: point.lng }); } }}><Tooltip>Draft office pin · changes apply only after Save office</Tooltip></Marker> : <CircleMarker center={officePoint} radius={7} pathOptions={{ color: 'white', weight: 2, fillColor: '#003b99', fillOpacity: 1 }}><Tooltip>Saved office · {office.name}</Tooltip></CircleMarker>}
        </>}
        {userPoint && <>
          <Circle center={userPoint} radius={sample.accuracy} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: .08, weight: 1, dashArray: '4 4' }}><Tooltip>Reported GPS accuracy · ±{sample.accuracy.toFixed(1)} m</Tooltip></Circle>
          <CircleMarker center={userPoint} radius={6} pathOptions={{ color: 'white', weight: 2, fillColor: '#f59e0b', fillOpacity: 1 }}><Tooltip>Your reported GPS position</Tooltip></CircleMarker>
        </>}
        {canPick && <PickOfficePoint onPick={onOfficePick} />}
        <ScaleControl position="bottomleft" imperial={false} />
      </MapContainer>
    </div>
    {tileError && <p role="status" className="sa-office-form-help">Map tiles are unavailable. Try the other map layer; GPS and manual coordinate fields still work.</p>}
    <p className="sa-office-form-help">{editable ? 'Choose Streets or Satellite, then click your office building or drag the blue pin. This changes only the draft. Review the coordinates and press Save office to apply.' : userPoint ? `Blue: fixed office and ${ATTENDANCE_RADIUS_M} m boundary. Orange: your GPS position; the dashed circle shows reported accuracy. This map is read-only.` : 'Only the fixed office pin is shown until a GPS reading meets the configured accuracy limit. This map is read-only.'}</p>
  </div>;
}
