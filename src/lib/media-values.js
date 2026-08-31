const signedTokenPattern = /[?&]token=[^&]+/;
const pathTokenPattern = /\/api\/media\/(?:event|venue)\/[^/?#]+\/[^/?#]+(?:[?#]|$)/i;
const apiMediaPattern = /^\/?api\/media\//i;
const legacyProtectedUploadPattern = /(?:^|\/)uploads\/(?:event-covers|venue-images|venue-covers)(?:\/|$)/i;

export const hasMediaToken = (value) =>
  typeof value === "string" &&
  (signedTokenPattern.test(value) || pathTokenPattern.test(value));

const asUrl = (value) => (typeof value === "string" ? value.trim() : "");

export const isExplicitMediaUrl = (value) =>
  typeof value === "string" &&
  !legacyProtectedUploadPattern.test(value) &&
  (/^(?:https?:)?\/\//i.test(value) || apiMediaPattern.test(value));

// API responses include both legacy filename fields and a resolved URL. Always
// prefer the signed URL, regardless of the order in which aliases are listed.
export const selectMediaUrl = (...values) => {
  const candidates = values.map(asUrl).filter(Boolean);
  return candidates.find(hasMediaToken) || candidates.find(isExplicitMediaUrl) || "";
};

// Event images must use the resolved URL returned by the API. Legacy fields
// such as coverImage, coverImagePath, and imageFilename are filenames/paths,
// not browser-safe sources for private or draft media.
export const eventMediaValue = (event) => selectMediaUrl(
  event?.coverImageUrl,
  event?.cover_image_url,
);

export const venueMediaValue = (venue) => selectMediaUrl(
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
  venue?.images?.find((image) => image?.isCover)?.url,
  venue?.images?.find((image) => image?.isCover)?.imageUrl,
  venue?.images?.[0]?.url,
  venue?.images?.[0]?.imageUrl,
);
