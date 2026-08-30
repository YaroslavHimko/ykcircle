import React, { useEffect, useRef, useState } from "react";
import { MapPinned } from "lucide-react";
import { openCookieSettings } from "@/components/CookieSettings";
import { getMapsConfig, loadGoogleMaps, readMapConsent } from "@/lib/maps";

const component = (items, type, field = "longText") => items?.find((item) => item.types?.includes(type))?.[field] || "";

class PickerErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p className="border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">Map search is unavailable. You can still add a location after maps are configured.</p> : this.props.children; }
}

function GoogleLocationPickerView({ onSelect, placeholder = "Search for an address" }) {
  const mapHost = useRef(null);
  const searchHost = useRef(null);
  const onSelectRef = useRef(onSelect);
  const [status, setStatus] = useState("loading");

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => {
    let disposed = false;
    let autocomplete;
    const setup = async () => {
      const config = await getMapsConfig();
      if (!config.enabled || !config.browserKey) return setStatus("unavailable");
      if (config.requiresConsent && !readMapConsent()) return setStatus("consent");
      const maps = await loadGoogleMaps(config);
      const [{ Map }, { PlaceAutocompleteElement }] = await Promise.all([
        maps.importLibrary("maps"), maps.importLibrary("places"),
      ]);
      if (disposed) return;
      const map = new Map(mapHost.current, {
        center: { lat: 59.3293, lng: 18.0686 }, zoom: 11,
        streetViewControl: false, mapTypeControl: false, fullscreenControl: true,
      });
      autocomplete = new PlaceAutocompleteElement({ placeholder });
      autocomplete.addEventListener("gmp-select", async ({ placePrediction }) => {
        const place = placePrediction.toPlace();
        await place.fetchFields({ fields: ["id", "displayName", "formattedAddress", "location", "addressComponents"] });
        if (disposed || !place.location) return;
        map.panTo(place.location);
        map.setZoom(16);
        new maps.InfoWindow({ content: String(place.displayName || place.formattedAddress || "Selected location"), position: place.location }).open(map);
        const items = place.addressComponents || [];
        onSelectRef.current({
          addressLine1: [component(items, "street_number"), component(items, "route")].filter(Boolean).join(" ") || place.displayName || "",
          postalCode: component(items, "postal_code"), locality: component(items, "locality") || component(items, "postal_town"),
          municipality: component(items, "administrative_area_level_2"), region: component(items, "administrative_area_level_1"),
          country: component(items, "country"), countryCode: component(items, "country", "shortText"),
          googlePlaceId: place.id, formattedAddress: place.formattedAddress || "", latitude: place.location.lat(), longitude: place.location.lng(),
        });
      });
      // Google owns this element's contents. Keep it empty in React's virtual
      // tree so React never tries to remove a child inserted by Google.
      searchHost.current?.replaceChildren(autocomplete);
      setStatus("ready");
    };
    setup().catch(() => !disposed && setStatus("error"));
    return () => { disposed = true; autocomplete?.remove(); };
  }, [placeholder]);

  if (status === "consent") return <div className="border border-border bg-secondary/30 p-4 text-sm text-muted-foreground"><MapPinned className="mb-2 h-5 w-5 text-primary" />Map search is disabled based on your privacy preferences. <button type="button" onClick={openCookieSettings} className="text-primary underline">Enable map</button></div>;
  if (status === "unavailable") return <p className="border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">Map search is unavailable because maps are disabled or no browser key was supplied by the backend.</p>;
  if (status === "error") return <p className="border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">Google Maps could not initialise. Check that Maps JavaScript API and Places API (New) are enabled for this browser key.</p>;
  return <div className="overflow-hidden border border-border">
    {status === "loading" && <div className="border-b border-border p-3"><div className="h-11 animate-pulse bg-secondary/40" /></div>}
    <div ref={searchHost} className="google-place-autocomplete border-b border-border p-3" />
    <div ref={mapHost} className="h-72 w-full" aria-label="Google map location picker" />
  </div>;
}

export default function GoogleLocationPicker(props) {
  return <PickerErrorBoundary><GoogleLocationPickerView {...props} /></PickerErrorBoundary>;
}
