const signedTokenPattern = /[?&]token=[^&]+/;
const pathTokenPattern = /\/api\/media\/(?:event|venue)\/[^/?#]+\/[^/?#]+(?:[?#]|$)/i;
const apiMediaPattern = /^\/?api\/media\//i;
const legacyProtectedUploadPattern = /(?:^|\/)uploads\/(?:event-covers|venue-images|venue-covers)(?:\/|$)/i;
const publicVenueUploadPattern = /(?:^|\/)uploads\/(?:venue-images|venue-covers)(?:\/|$)/i;

export const hasMediaToken = (value) =>
  typeof value === "string" &&
  (signedTokenPattern.test(value) || pathTokenPattern.test(value));

const asUrl = (value) => (typeof value === "string" ? value.trim() : "");

export const isExplicitMediaUrl = (value) =>
  typeof value === "string" &&
  !legacyProtectedUploadPattern.test(value) &&
  (/^(?:https?:)?\/\//i.test(value) || apiMediaPattern.test(value));

export const isLegacyMediaUploadUrl = (value) =>
  typeof value === "string" && legacyProtectedUploadPattern.test(value);

export const isPublicVenueImageUrl = (value) =>
  typeof value === "string" && publicVenueUploadPattern.test(value);

export const isPublicEvent = (event) =>
  String(event?.status || "").toLowerCase() === "published" &&
  String(event?.visibility || "").toLowerCase() === "public";

// API responses include both legacy filename fields and a resolved URL. Always
// prefer the signed URL, regardless of the order in which aliases are listed.
export const selectMediaUrl = (...values) => {
  const candidates = values.map(asUrl).filter(Boolean);
  return candidates.find(hasMediaToken) || candidates.find(isExplicitMediaUrl) || "";
};

// Event images must use the resolved URL returned by the API. Legacy fields
// such as coverImage, coverImagePath, and imageFilename are filenames/paths,
// not browser-safe sources for private or draft media.
export const eventMediaValue = (event) => {
  const apiUrl = selectMediaUrl(event?.coverImageUrl, event?.cover_image_url);
  if (apiUrl) return apiUrl;

  // Published public events retain their existing public-media route. This is
  // deliberately unavailable to drafts/private events, which must provide a
  // signed path-token URL through coverImageUrl.
  const publicCoverUrl = asUrl(event?.coverImageUrl || event?.cover_image_url);
  return isPublicEvent(event) && isLegacyMediaUploadUrl(publicCoverUrl)
    ? publicCoverUrl
    : "";
};

export const venueMediaValue = (venue) => {
  const cover = venue?.images?.find((image) => image?.isCover);
  const values = [
    venue?.coverImageUrl,
    venue?.cover_image_url,
    venue?.coverUrl,
    venue?.cover_url,
    venue?.imageUrl,
    venue?.image_url,
    venue?.mediaUrl,
    venue?.media_url,
    venue?.coverImage,
    venue?.cover_image,
    venue?.cover,
    venue?.image,
    cover?.url,
    cover?.imageUrl,
    venue?.images?.[0]?.url,
    venue?.images?.[0]?.imageUrl,
  ];
  const resolved = selectMediaUrl(...values);
  if (resolved) return resolved;

  // The public venue endpoint returns this route for approved active venues.
  // Only inspect URL fields here: a bare coverImage filename must never be
  // turned into a request for a protected upload.
  return [
    venue?.coverImageUrl,
    venue?.cover_image_url,
    venue?.coverUrl,
    venue?.cover_url,
    venue?.imageUrl,
    venue?.image_url,
    venue?.mediaUrl,
    venue?.media_url,
    cover?.url,
    cover?.imageUrl,
    venue?.images?.[0]?.url,
    venue?.images?.[0]?.imageUrl,
  ].map(asUrl).find(isPublicVenueImageUrl) || "";
};
