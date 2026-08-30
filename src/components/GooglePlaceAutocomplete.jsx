import React, { useEffect, useRef, useState } from "react";
import { getMapsConfig, loadGoogleMaps, readMapConsent } from "@/lib/maps";

const component = (items, type, field = "longText") => items?.find((item) => item.types?.includes(type))?.[field] || "";

export default function GooglePlaceAutocomplete({ onSelect, placeholder = "Search for an address" }) {
  const host = useRef(null);
  const onSelectRef = useRef(onSelect);
  const [status, setStatus] = useState("loading");
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => {
    let disposed = false;
    let element;
    const setup = async () => {
      const config = await getMapsConfig();
      if (!config.enabled || !config.browserKey) return setStatus("unavailable");
      if (config.requiresConsent && !readMapConsent()) return setStatus("consent");
      const maps = await loadGoogleMaps(config);
      const { PlaceAutocompleteElement } = await maps.importLibrary("places");
      if (disposed) return;
      element = new PlaceAutocompleteElement({ placeholder });
      element.addEventListener("gmp-select", async ({ placePrediction }) => {
        const place = placePrediction.toPlace();
        await place.fetchFields({ fields: ["id", "displayName", "formattedAddress", "location", "addressComponents"] });
        if (disposed || !place.location) return;
        const items = place.addressComponents || [];
        onSelectRef.current({
          addressLine1: [component(items, "street_number"), component(items, "route")].filter(Boolean).join(" ") || place.displayName || "",
          postalCode: component(items, "postal_code"), locality: component(items, "locality") || component(items, "postal_town"),
          municipality: component(items, "administrative_area_level_2"), region: component(items, "administrative_area_level_1"),
          country: component(items, "country"), countryCode: component(items, "country", "shortText"),
          googlePlaceId: place.id, formattedAddress: place.formattedAddress || "", latitude: place.location.lat(), longitude: place.location.lng(),
        });
      });
      host.current?.replaceChildren(element);
      setStatus("ready");
    };
    setup().catch(() => !disposed && setStatus("unavailable"));
    return () => { disposed = true; element?.remove(); };
  }, [placeholder]);
  if (status === "unavailable") return null;
  if (status === "consent") return <p className="text-xs text-muted-foreground">Address search is available after enabling maps in privacy preferences.</p>;
  return <div ref={host} className="google-place-autocomplete min-h-11">{status === "loading" && <div className="h-11 animate-pulse border border-border bg-secondary/40" />}</div>;
}
