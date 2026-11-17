import { resolveMediaUrl, selectMediaUrl, venueMediaUrl } from '@/shared/media/media.js';
export const asList = (data, key) => (Array.isArray(data) ? data : data?.[key] || []);
export const venueId = (venue) =>
  venue?.id ?? venue?.venueId ?? venue?.venue_id ?? venue?.venue?.id;
export const normalizeVenue = (venue) => ({
  ...venue,
  id: venueId(venue),
});
export const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('authToken')}`,
});
export const inputClass = 'mt-2 min-h-11 w-full border border-border bg-background px-3';
export const textareaClass = 'mt-2 min-h-28 w-full border border-border bg-background p-3';
export const getError = (data, fallback) => data?.error || data?.message || fallback;
export const humanize = (value = '') =>
  String(value)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
export const toNumber = (value) => (value === '' || value == null ? undefined : Number(value));
export const publicLocation = (venue) => {
  const location = venue.location || {};
  if (['private', 'private_until_booking'].includes(venue.locationVisibility))
    return 'Exact address shared after booking confirmation.';
  const area = [
    location.locality || venue.city,
    location.municipality || venue.municipality,
    location.region || venue.region,
    location.country || venue.country,
  ].filter(Boolean);
  if (venue.locationVisibility === 'exact')
    return [venue.addressLine1 || venue.address, ...area].filter(Boolean).join(', ');
  return area.join(', ') || 'Location shared on request';
};
export const priceLabel = (venue) => {
  const pricing = venue.pricing || {};
  if ((pricing.unit || venue.priceUnit) === 'contact') return 'Contact venue for pricing';
  const price = pricing.from ?? venue.priceFrom;
  if (price == null || price === '') return 'Contact venue for pricing';
  if (Number(price) === 0) return 'Free';
  return `From ${new Intl.NumberFormat('sv-SE', {
    maximumFractionDigits: 0,
  }).format(
    price,
  )} ${pricing.currency || venue.currency || 'SEK'}${pricing.unit || venue.priceUnit ? ` / ${humanize(pricing.unit || venue.priceUnit).toLowerCase()}` : ''}`;
};
export const capacityLabel = (venue) => {
  const capacity = venue.capacity || {};
  const value = capacity.max ?? venue.capacityMax ?? capacity.standing ?? venue.standingCapacity;
  return value ? `Up to ${value} guests` : 'Capacity on request';
};
// Venue image URLs are API-supplied and may carry a short-lived signed token.
// A bare filename is intentionally not a renderable media URL.

export // Venue image URLs are API-supplied and may carry a short-lived signed token.
// A bare filename is intentionally not a renderable media URL.
const imageUrl = venueMediaUrl;
export const galleryImageUrl = (image) =>
  resolveMediaUrl(
    selectMediaUrl(
      image?.url,
      image?.imageUrl,
      image?.image_url,
      image?.mediaUrl,
      image?.media_url,
      image?.filename,
    ),
  );
export const emptyVenue = {
  name: '',
  shortDescription: '',
  description: '',
  venueType: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  city: '',
  municipality: '',
  region: '',
  country: 'Sweden',
  countryCode: 'SE',
  googlePlaceId: '',
  formattedAddress: '',
  latitude: '',
  longitude: '',
  locationVisibility: 'exact',
  capacityMin: '',
  capacityMax: '',
  standingCapacity: '',
  seatedCapacity: '',
  diningCapacity: '',
  classroomCapacity: '',
  sizeSqm: '',
  pricingType: 'free',
  priceFrom: '0',
  priceUnit: 'hour',
  currency: 'SEK',
  pricingDescription: '',
  minimumBookingHours: '',
  availabilityType: 'calendar',
  availability: [],
  houseRulesText: '',
  amenities: [],
  suitableEventTypes: [],
  billingProfileId: '',
};
export function toForm(venue) {
  const location = venue.location || {};
  const pricing = venue.pricing || {};
  const capacity = venue.capacity || {};
  const priceUnit = venue.priceUnit || pricing.unit || 'hour';
  return {
    ...emptyVenue,
    ...venue,
    addressLine1: venue.addressLine1 || location.addressLine1 || venue.address || '',
    addressLine2: venue.addressLine2 || location.addressLine2 || '',
    postalCode: venue.postalCode || location.postalCode || '',
    city: venue.city || location.locality || '',
    municipality: venue.municipality || location.municipality || '',
    region: venue.region || location.region || '',
    country: venue.country || location.country || 'Sweden',
    countryCode: venue.countryCode || location.countryCode || '',
    googlePlaceId: venue.googlePlaceId || location.googlePlaceId || '',
    formattedAddress: venue.formattedAddress || location.formattedAddress || '',
    latitude: venue.latitude ?? location.latitude ?? '',
    longitude: venue.longitude ?? location.longitude ?? '',
    capacityMin: venue.capacityMin ?? capacity.min ?? '',
    capacityMax: venue.capacityMax ?? capacity.max ?? '',
    standingCapacity: venue.standingCapacity ?? capacity.standing ?? '',
    seatedCapacity: venue.seatedCapacity ?? capacity.seated ?? '',
    diningCapacity: venue.diningCapacity ?? capacity.dining ?? '',
    classroomCapacity: venue.classroomCapacity ?? capacity.classroom ?? '',
    sizeSqm: venue.sizeSqm ?? capacity.sizeSqm ?? '',
    pricingType: Number(venue.priceFrom ?? pricing.from) > 0 ? 'paid' : 'free',
    priceFrom: venue.priceFrom ?? pricing.from ?? '0',
    priceUnit,
    currency: venue.currency || pricing.currency || 'SEK',
    pricingDescription: venue.pricingDescription || pricing.description || '',
    amenities: (venue.amenities || []).map((item) => item.slug || item),
    suitableEventTypes: (venue.suitableEventTypes || []).map((item) => item.slug || item),
    billingProfileId: venue.billingProfileId || '',
  };
}
