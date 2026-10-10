import React, { useEffect, useRef, useState } from "react";
import { MapPinned } from "lucide-react";
import { openCookieSettings } from "@/components/CookieSettings";
import { getMapsConfig, loadGoogleMaps, readMapConsent, reportHighPlacesActivity } from "@/lib/maps";

const component = (items, type, field = "longText") => items?.find((item) => item.types?.includes(type))?.[field] || "";
const debounceMs = 400;
const minimumQueryLength = 3;
const activityWindowMs = 10 * 60 * 1000;
const unusualActivityThreshold = 20;
const placesActivity = { timestamps: [], lastReportedAt: 0 };

const notePlacesRequest = () => {
  const now = Date.now();
  placesActivity.timestamps = placesActivity.timestamps.filter((time) => now - time < activityWindowMs);
  placesActivity.timestamps.push(now);
  if (placesActivity.timestamps.length >= unusualActivityThreshold && now - placesActivity.lastReportedAt >= activityWindowMs) {
    placesActivity.lastReportedAt = now;
    // Keep browser logs and the optional server signal free of user-entered
    // search terms and selected-place data.
    console.warn("Unusually high Google Places activity from this browser session.", { count: placesActivity.timestamps.length, windowMs: activityWindowMs });
    void reportHighPlacesActivity(placesActivity.timestamps.length, activityWindowMs);
  }
};

class PickerErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">Map search is unavailable. You can still add a location after maps are configured.</p> : this.props.children; }
}

function LocationSearchSession({ onSelect, placeholder, onClose }) {
  const mapHost = useRef(null);
  const onSelectRef = useRef(onSelect);
  const mapsRef = useRef(null);
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const placesRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const debounceTimer = useRef(null);
  const latestRequest = useRef(0);
  const [status, setStatus] = useState("loading");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    let disposed = false;
    const setup = async () => {
      const config = await getMapsConfig();
      if (!config.enabled || !config.browserKey) return setStatus("unavailable");
      if (config.requiresConsent && !readMapConsent()) return setStatus("consent");
      const maps = await loadGoogleMaps(config);
      const [{ Map }, places] = await Promise.all([
        maps.importLibrary("maps"), maps.importLibrary("places"),
      ]);
      if (disposed || !mapHost.current) return;
      mapsRef.current = maps;
      placesRef.current = places;
      mapRef.current = new Map(mapHost.current, {
        center: { lat: 59.3293, lng: 18.0686 }, zoom: 11,
        streetViewControl: false, mapTypeControl: false, fullscreenControl: true,
      });
      setStatus("ready");
    };
    setup().catch(() => !disposed && setStatus("error"));
    return () => {
      disposed = true;
      latestRequest.current += 1;
      clearTimeout(debounceTimer.current);
      sessionTokenRef.current = null;
    };
  }, []);

  const ensureSessionToken = () => {
    if (!sessionTokenRef.current) sessionTokenRef.current = new placesRef.current.AutocompleteSessionToken();
    return sessionTokenRef.current;
  };

  const search = (value) => {
    if (selecting) return;
    setQuery(value);
    clearTimeout(debounceTimer.current);
    const requestId = ++latestRequest.current;
    const input = value.trim();
    if (input.length < minimumQueryLength || status !== "ready") {
      setSuggestions([]);
      return;
    }
    debounceTimer.current = setTimeout(async () => {
      try {
        const { AutocompleteSuggestion } = placesRef.current;
        notePlacesRequest();
        const result = await AutocompleteSuggestion.fetchAutocompleteSuggestions({ input, sessionToken: ensureSessionToken() });
        if (requestId === latestRequest.current) setSuggestions(result.suggestions.filter((item) => item.placePrediction));
      } catch {
        if (requestId === latestRequest.current) setSuggestions([]);
      }
    }, debounceMs);
  };

  const selectPlace = async (prediction) => {
    const requestId = ++latestRequest.current;
    clearTimeout(debounceTimer.current);
    setSelecting(true);
    try {
      const place = prediction.toPlace();
      notePlacesRequest();
      await place.fetchFields({ fields: ["id", "displayName", "formattedAddress", "location", "addressComponents"] });
      if (requestId !== latestRequest.current || !place.location) return;
      const map = mapRef.current;
      map.panTo(place.location);
      map.setZoom(16);
      infoWindowRef.current?.close();
      infoWindowRef.current = new mapsRef.current.InfoWindow({ content: String(place.displayName || place.formattedAddress || "Selected location"), position: place.location });
      infoWindowRef.current.open({ map });
      const items = place.addressComponents || [];
      onSelectRef.current({
        addressLine1: [component(items, "street_number"), component(items, "route")].filter(Boolean).join(" ") || place.displayName || "",
        postalCode: component(items, "postal_code"), locality: component(items, "locality") || component(items, "postal_town"),
        municipality: component(items, "administrative_area_level_2"), region: component(items, "administrative_area_level_1"),
        country: component(items, "country"), countryCode: component(items, "country", "shortText"),
        googlePlaceId: place.id, formattedAddress: place.formattedAddress || "", latitude: place.location.lat(), longitude: place.location.lng(),
      });
      setQuery(place.formattedAddress || place.displayName || "");
      setSuggestions([]);
    } catch {
      if (requestId === latestRequest.current) setSuggestions([]);
    } finally {
      if (requestId === latestRequest.current) {
        // fetchFields concludes this Places session. Discarding the token on
        // both success and failure prevents it leaking into a later search.
        sessionTokenRef.current = null;
        setSelecting(false);
      }
    }
  };

  if (status === "consent") return <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground"><MapPinned className="mb-2 h-5 w-5 text-primary" />Map search is disabled based on your privacy preferences. <button type="button" onClick={openCookieSettings} className="text-primary underline">Enable map</button></div>;
  if (status === "unavailable") return <p className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">Map search is unavailable because maps are disabled or no browser key was supplied by the backend.</p>;
  if (status === "error") return <p className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">Google Maps could not initialise. Check that Maps JavaScript API and Places API (New) are enabled for this browser key.</p>;

  return <div className="overflow-hidden border border-border">
    <div className="border-b border-border p-3">
      {status === "loading" ? <div className="h-11 animate-pulse bg-secondary/40" /> : <>
        <label className="sr-only" htmlFor="location-search">{placeholder}</label>
        <input id="location-search" value={query} onChange={(event) => search(event.target.value)} placeholder={placeholder} autoComplete="off" disabled={selecting} className="min-h-11 w-full border border-border bg-background px-3 text-sm disabled:opacity-60" />
        {query.trim().length > 0 && query.trim().length < minimumQueryLength && <p className="mt-2 text-xs text-muted-foreground">Type at least {minimumQueryLength} characters to search.</p>}
        {suggestions.length > 0 && <ul className="mt-2 max-h-60 overflow-auto border border-border bg-background" aria-label="Address suggestions">{suggestions.map((suggestion, index) => {
          const prediction = suggestion.placePrediction;
          const text = prediction.text?.toString() || "Address suggestion";
          return <li key={`${text}-${index}`}><button type="button" disabled={selecting} onClick={() => void selectPlace(prediction)} className="w-full px-3 py-3 text-left text-sm hover:bg-secondary disabled:opacity-60">{text}</button></li>;
        })}</ul>}
      </>}
    </div>
    <div ref={mapHost} className="h-72 w-full" aria-label="Google map location picker" />
    <div className="border-t border-border p-3"><button type="button" onClick={onClose} className="text-sm text-muted-foreground underline">Close location search</button></div>
  </div>;
}

function GoogleLocationPickerView({ onSelect, placeholder = "Search for an address" }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="ui-action inline-flex min-h-11 items-center gap-2 border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground"><MapPinned className="h-4 w-4" />Search address on map</button>;
  return <LocationSearchSession onSelect={onSelect} placeholder={placeholder} onClose={() => setOpen(false)} />;
}

export default function GoogleLocationPicker(props) {
  return <PickerErrorBoundary><GoogleLocationPickerView {...props} /></PickerErrorBoundary>;
}
