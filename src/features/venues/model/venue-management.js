export const isVenueActive = (value) =>
  value === true || value === 1 || value === '1' || value === 'true';
export const list = (data, key) => (Array.isArray(data) ? data : data?.[key] || []);
export const locationText = (location) =>
  typeof location === 'string'
    ? location
    : location?.addressLine1 ||
      location?.address ||
      location?.locality ||
      location?.city ||
      location?.municipality ||
      location?.region ||
      location?.country ||
      '';
export const normalizeVenue = (venue) => ({
  ...venue,
  id: venue?.id ?? venue?.venueId ?? venue?.venue_id ?? venue?.venue?.id,
  location: locationText(venue?.location),
});
export const auth = () => ({
  Authorization: `Bearer ${localStorage.getItem('authToken')}`,
});
export const errorText = (data, fallback) =>
  [
    data?.error || data?.message,
    data?.fields &&
      Object.entries(data.fields)
        .map(([field, message]) => `${field}: ${message}`)
        .join(' '),
  ]
    .filter(Boolean)
    .join(' ') || fallback;
export const bookingStart = (booking) =>
  booking.event?.startsAt || booking.startsAt || booking.startAt || booking.starts_at || null;
export const moderationLabels = {
  draft: 'Draft',
  pending: 'Pending review',
  approved: 'Published',
  rejected: 'Rejected',
  removed: 'Removed',
};
export const moderationStyles = {
  approved: 'border-primary text-primary',
  rejected: 'border-destructive text-destructive',
  removed: 'border-destructive text-destructive',
};
