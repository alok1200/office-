import React, { lazy, Suspense } from 'react';
const GeofenceMap = lazy(() => import('./GeofenceMap'));
class MapBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="status" className="sa-info">The map could not load. GPS verification and manual coordinate fields are still available.</p> : this.props.children; }
}
export function GeofenceMapPanel(props) {
  return <MapBoundary><Suspense fallback={<p role="status" className="sa-info">Loading office map…</p>}><GeofenceMap {...props} /></Suspense></MapBoundary>;
}
