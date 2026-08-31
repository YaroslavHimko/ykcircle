const signedTokenPattern = /[?&]token=[^&]+/;
const apiMediaPattern = /^\/?api\/media\//i;
const uploadPathPattern = /^\/?uploads\/(?:event-covers|venue-images|venue-covers)\//i;

export const hasMediaToken = (value) =>
  typeof value === "string" && signedTokenPattern.test(value);

const asUrl = (value) => (typeof value === "string" ? value.trim() : "");

export const isExplicitMediaUrl = (value) =>
  /^(?:https?:)?\/\//i.test(value) || apiMediaPattern.test(value) || uploadPathPattern.test(value);

// API responses include both legacy filename fields and a resolved URL. Always
// prefer the signed URL, regardless of the order in which aliases are listed.
export const selectMediaUrl = (...values) => {
  const candidates = values.map(asUrl).filter(Boolean);
  return candidates.find(hasMediaToken) || candidates.find(isExplicitMediaUrl) || "";
};

export const eventMediaValue = (event) => selectMediaUrl(
  event?.coverImageUrl,
  event?.cover_image_url,
  event?.thumbnailUrl,
  event?.thumbnail_url,
  event?.coverUrl,
  event?.cover_url,
  event?.imageUrl,
  event?.image_url,
  event?.mediaUrl,
  event?.media_url,
  event?.coverImage,
  event?.cover_image,
  event?.thumbnail,
  event?.cover,
  event?.image,
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
