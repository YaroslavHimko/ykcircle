import { apiAssetUrl } from "./api.js";
import {
  eventMediaValue,
  hasMediaToken,
  isExplicitMediaUrl,
  selectMediaUrl,
  venueMediaValue,
} from "./media-values.js";

export { hasMediaToken, isExplicitMediaUrl, selectMediaUrl };

const asUrl = (value) => (typeof value === "string" ? value.trim() : "");

// Deliberately accept only a URL/path the API supplied. In particular, do not
// turn a filename such as "cover.png" into a protected media URL.
export const resolveMediaUrl = (value) => {
  const url = asUrl(value);
  if (!url) return "";
  if (/^(?:https?:)?\/\//i.test(url) || url.startsWith("/images/")) return url;
  if (isExplicitMediaUrl(url)) {
    return apiAssetUrl(url.startsWith("/") ? url : `/${url}`);
  }
  return "";
};

export const eventMediaUrl = (event) => resolveMediaUrl(eventMediaValue(event));

export const venueMediaUrl = (venue) => resolveMediaUrl(venueMediaValue(venue));

export const mediaRenderDebug = ({ component, eventId, venueId, rawUrl }) => {
  // Never print signed query parameters. The redacted URL still identifies the
  // media resource in DevTools while hasToken proves whether it was signed.
  const value = asUrl(rawUrl);
  console.debug("MEDIA_RENDER", {
    component,
    eventId,
    venueId,
    rawUrl: value ? value.split("?", 1)[0] : value,
    hasToken: hasMediaToken(value),
  });
};
