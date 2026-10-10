import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, MapPinned } from "lucide-react";
import { getMapsConfig, hasCoordinates, loadGoogleMaps, mapsNavigationUrl, normalizeLocation, readMapConsent } from "@/lib/maps";
import { openCookieSettings } from "@/components/CookieSettings";

class MapErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="rounded-2xl mt-5 border border-border bg-secondary/30 p-5 text-sm text-muted-foreground">Map unavailable</div> : this.props.children; }
}

function GoogleMapCanvas({ config, location, label, zoom, interactive, onError }) {
  const host = useRef(null);
  useEffect(() => {
    let disposed = false;
    const position = { lat: Number(location.latitude), lng: Number(location.longitude) };
    loadGoogleMaps(config).then(async (maps) => {
      const { Map } = await maps.importLibrary("maps");
      if (disposed || !host.current) return;
      const map = new Map(host.current, { center: position, zoom, streetViewControl: false, mapTypeControl: false, fullscreenControl: interactive, gestureHandling: interactive ? "auto" : "none" });
      new maps.InfoWindow({ content: String(label), position }).open({ map });
    }).catch((error) => {
      console.error("Unable to initialise the location map:", error);
      if (!disposed) onError(error);
    });
    return () => { disposed = true; };
  }, [config, interactive, label, location.latitude, location.longitude, onError, zoom]);
  return <div ref={host} className="h-72 w-full border border-border" aria-label={`Map of ${label}`} />;
}

function MapLocationView({ location, label = "Location", zoom = 14, interactive = true, hidden = false }) {
  const [state, setState] = useState("loading");
  const [config, setConfig] = useState(null);
  const normalised = useMemo(() => normalizeLocation(location), [location]);
  const navigationUrl = useMemo(() => hidden ? "" : mapsNavigationUrl(normalised), [hidden, normalised]);
  const markMapError = useCallback(() => setState("error"), []);

  useEffect(() => {
    let current = true;
    getMapsConfig().then((next) => {
      if (!current) return;
      setConfig(next);
      if (!next.enabled || !next.browserKey) setState("disabled");
      else if (next.requiresConsent && !readMapConsent()) setState("consent");
      else if (!normalised.googlePlaceId && !hasCoordinates(normalised)) setState("disabled");
      else setState("loaded");
    }).catch(() => current && setState("error"));
    const onConsent = () => config?.requiresConsent && setState(readMapConsent() ? "loaded" : "consent");
    window.addEventListener("ykcircle:cookie-consent", onConsent);
    return () => { current = false; window.removeEventListener("ykcircle:cookie-consent", onConsent); };
  }, [normalised.googlePlaceId, normalised.latitude, normalised.longitude, config?.requiresConsent]);

  if (hidden || !navigationUrl) return null;
  return <div className="mt-5">
    {state === "loaded" ? <GoogleMapCanvas config={config} location={normalised} label={label} zoom={zoom} onError={markMapError} interactive={interactive} /> :
      <div className="rounded-2xl flex h-40 flex-col items-center justify-center border border-border bg-secondary/30 p-5 text-center text-sm text-muted-foreground">
        {state === "loading" && <><span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /><span className="mt-3">Loading map…</span></>}
        {state === "consent" && <><MapPinned className="h-6 w-6 text-primary" /><span className="mt-3">Map is disabled based on your privacy preferences.</span><button type="button" onClick={openCookieSettings} className="mt-3 text-primary underline">Enable map</button></>}
        {state === "disabled" && "Map unavailable"}
        {state === "error" && "Map unavailable"}
      </div>}
    <a href={navigationUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-primary underline"><ExternalLink className="h-4 w-4" />Open in Google Maps</a>
  </div>;
}

export default function MapLocation(props) {
  return <MapErrorBoundary><MapLocationView {...props} /></MapErrorBoundary>;
}
