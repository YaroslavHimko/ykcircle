import { apiAssetUrl } from "./api.js";
import {
  eventMediaValue,
  hasMediaToken,
  isExplicitMediaUrl,
  isLegacyMediaUploadUrl,
  isPublicEvent,
  selectMediaUrl,
  venueMediaValue,
} from "./media-values.js";

export { hasMediaToken, isExplicitMediaUrl, selectMediaUrl };

const asUrl = (value) => (typeof value === "string" ? value.trim() : "");
const redactMediaUrl = (value) => asUrl(value)
  .replace(/(\/api\/media\/(?:event|venue)\/)[^/?#]+(?=\/)/i, "$1[TOKEN]")
  .replace(/([?&]token=)[^&#]*/i, "$1[redacted]");

// Deliberately accept only a URL/path the API supplied. In particular, do not
// turn a filename such as "cover.png" into a protected media URL.
export const resolveMediaUrl = (value, { allowPublicUpload = false } = {}) => {
  const url = asUrl(value);
  if (!url) return "";
  if (/^(?:https?:)?\/\//i.test(url) || url.startsWith("/images/")) return url;
  if (allowPublicUpload && isLegacyMediaUploadUrl(url)) {
    return apiAssetUrl(url.startsWith("/") ? url : `/${url}`);
  }
  if (isExplicitMediaUrl(url)) {
    return apiAssetUrl(url.startsWith("/") ? url : `/${url}`);
  }
  return "";
};

export const eventMediaUrl = (event) =>
  resolveMediaUrl(eventMediaValue(event), { allowPublicUpload: isPublicEvent(event) });

export const venueMediaUrl = (venue) => resolveMediaUrl(venueMediaValue(venue));

export const mediaRenderDebug = ({ component, eventId, venueId, rawUrl }) => {
  // Never print signed query or path parameters. The redacted URL still
  // identifies the media resource in DevTools while hasToken proves access.
  const value = asUrl(rawUrl);
  console.debug("MEDIA_RENDER", {
    component,
    eventId,
    venueId,
    rawUrl: redactMediaUrl(value),
    hasToken: hasMediaToken(value),
  });
};

export const eventImageRenderDebug = ({ component, event }) => {
  console.debug("EVENT_IMAGE_RENDER", {
    component,
    eventId: event?.id,
    sourceType: hasMediaToken(event?.coverImageUrl)
      ? "signed-url"
      : event?.coverImageUrl
        ? "public-api-url"
      : event?.coverImagePath
        ? "legacy-path"
        : "none",
    hasToken: hasMediaToken(event?.coverImageUrl),
  });
};
