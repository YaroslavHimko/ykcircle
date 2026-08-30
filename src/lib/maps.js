import { apiFetch } from "@/lib/api";

let configRequest;
let scriptRequest;

const isValidCoordinate = (latitude, longitude) =>
  Number.isFinite(Number(latitude)) && Number(latitude) >= -90 && Number(latitude) <= 90 &&
  Number.isFinite(Number(longitude)) && Number(longitude) >= -180 && Number(longitude) <= 180;

export const hasCoordinates = (location = {}) => isValidCoordinate(location.latitude, location.longitude);

export const normalizeLocation = (source = {}) => {
  const location = source.location || source;
  return {
    addressLine1: location.addressLine1 ?? location.address_line_1 ?? source.addressLine1 ?? source.address ?? "",
    addressLine2: location.addressLine2 ?? location.address_line_2 ?? source.addressLine2 ?? "",
    postalCode: location.postalCode ?? location.postal_code ?? source.postalCode ?? "",
    locality: location.locality ?? location.city ?? source.city ?? "",
    municipality: location.municipality ?? source.municipality ?? "",
    region: location.region ?? source.region ?? "",
    country: location.country ?? source.country ?? "",
    countryCode: location.countryCode ?? location.country_code ?? source.countryCode ?? "",
    latitude: location.latitude ?? source.latitude,
    longitude: location.longitude ?? source.longitude,
    googlePlaceId: location.googlePlaceId ?? location.google_place_id ?? source.googlePlaceId ?? "",
    formattedAddress: location.formattedAddress ?? location.formatted_address ?? source.formattedAddress ?? "",
  };
};

export const locationLines = (source, { exact = true } = {}) => {
  const location = normalizeLocation(source);
  if (!exact) return [location.locality, location.municipality, location.region, location.country].filter((value, index, all) => value && all.indexOf(value) === index);
  const street = [location.addressLine1, location.addressLine2].filter(Boolean).join(", ");
  const city = [location.postalCode, location.locality || location.municipality].filter(Boolean).join(" ");
  return [street, city, location.region, location.country].filter((value, index, all) => value && all.indexOf(value) === index);
};

export const mapsNavigationUrl = (source) => {
  const location = normalizeLocation(source);
  if (location.googlePlaceId) {
    const query = hasCoordinates(location) ? `${location.latitude},${location.longitude}` : location.googlePlaceId;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&query_place_id=${encodeURIComponent(location.googlePlaceId)}`;
  }
  if (!hasCoordinates(location)) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.latitude},${location.longitude}`)}`;
};

const normaliseConfig = (value = {}) => ({
  enabled: value.enabled === true || value.googleMapsEnabled === true || value.mapsEnabled === true,
  browserKey: value.browserKey || value.browserApiKey || value.googleMapsBrowserApiKey || "",
  requiresConsent: value.requiresConsent === true || value.consentRequired === true,
});

export const getMapsConfig = () => {
  if (!configRequest) {
    configRequest = apiFetch("/api/maps/config")
      .then(async (response) => {
        if (!response.ok) throw new Error("Map configuration is unavailable.");
        return normaliseConfig(await response.json());
      })
      .catch(() => normaliseConfig());
  }
  return configRequest;
};

export const readMapConsent = () => {
  try { return Boolean(JSON.parse(localStorage.getItem("ykcircle-cookie-consent") || "{}").externalMedia); }
  catch { return false; }
};

export const loadGoogleMaps = async (config) => {
  if (!config?.enabled || !config.browserKey) throw new Error("Google Maps is not configured.");
  if (window.google?.maps?.importLibrary) return window.google.maps;
  if (!scriptRequest) {
    scriptRequest = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      // The direct script loader resolves through its load event. Google's
      // `loading=async` mode requires a callback instead, so do not combine it
      // with this promise-based loader.
      const params = new URLSearchParams({ key: config.browserKey, v: "weekly" });
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.onload = () => window.google?.maps?.importLibrary ? resolve(window.google.maps) : reject(new Error("Google Maps did not initialise."));
      script.onerror = () => reject(new Error("Google Maps could not load."));
      document.head.appendChild(script);
    });
  }
  return scriptRequest;
};
