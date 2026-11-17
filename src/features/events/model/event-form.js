import { eventMediaUrl } from '@/shared/media/media.js';
import { deviceTimezone, localDateTimeForZone } from '@/shared/utils/time.js';
export const isBookableVenue = (venue) =>
  venue?.moderationStatus === 'approved' &&
  (venue.isActive === true ||
    venue.isActive === 1 ||
    venue.isActive === '1' ||
    venue.isActive === 'true');
export const initialForm = {
  title: '',
  shortDescription: '',
  description: '',
  foodOptions: [],
  coverImage: '',
  brandName: '',
  logoImage: '',
  categoryId: '',
  typeId: '',
  country: '',
  city: 'Stockholm',
  locationType: 'custom',
  venueId: '',
  location: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  locality: 'Stockholm',
  municipality: '',
  region: '',
  countryCode: 'SE',
  latitude: '',
  longitude: '',
  googlePlaceId: '',
  formattedAddress: '',
  onlineUrl: '',
  onlinePlatform: '',
  startsAt: '',
  endsAt: '',
  recurrenceFrequency: 'none',
  recurrenceInterval: '1',
  recurrenceCount: '2',
  timezone: deviceTimezone(),
  pricingType: 'free',
  fee: '0',
  currency: 'SEK',
  registrationType: 'yaroko',
  visibility: 'Public',
};
export const toInputDate = (value, timezone = deviceTimezone()) =>
  localDateTimeForZone(value, timezone);
export const eventDateTimeLabel = (event) => {
  if (!event?.startsAt) return 'Date to be announced';
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const start = formatter.format(new Date(event.startsAt));
  return event.endsAt ? `${start} – ${formatter.format(new Date(event.endsAt))}` : start;
};
export const eventCover = eventMediaUrl;
export const eventValue = (event, ...keys) =>
  keys.map((key) => event?.[key]).find((value) => value !== undefined && value !== null) ?? '';
