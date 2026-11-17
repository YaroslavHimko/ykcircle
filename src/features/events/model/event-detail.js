import { apiAssetUrl } from '@/shared/api/client.js';
import { eventMediaUrl } from '@/shared/media/media.js';
import { locationLines } from '@/shared/maps/maps.js';
import { dateForZone, deviceTimezone } from '@/shared/utils/time.js';
export const eventLocation = (event) => {
  if (event?.locationType === 'venue') return event.venue || {};
  if (event?.locationType === 'custom') return event.location || {};
  return {
    location: event?.location,
    address: event?.address,
    city: event?.city,
    country: event?.country,
    latitude: event?.latitude,
    longitude: event?.longitude,
    googlePlaceId: event?.googlePlaceId,
  };
};
export const eventLocationText = (event) => {
  if (event?.locationType === 'online') return 'Online event';
  const location = eventLocation(event);
  const lines = locationLines(location, {
    exact: event?.locationVisibility !== 'private',
  });
  return (
    [event?.locationType === 'venue' ? event.venue?.name : '', ...lines]
      .filter(Boolean)
      .join(', ') || 'To be announced'
  );
};
export const eventDateTimeLabel = (event) => {
  if (!event?.startsAt) return 'To be announced';
  const options = {
    dateStyle: 'medium',
    timeStyle: 'short',
  };
  try {
    const formatter = new Intl.DateTimeFormat(undefined, options);
    const start = formatter.format(new Date(event.startsAt));
    return event.endsAt ? `${start} – ${formatter.format(new Date(event.endsAt))}` : start;
  } catch {
    return event.endsAt
      ? `${new Date(event.startsAt).toLocaleString()} – ${new Date(event.endsAt).toLocaleString()}`
      : new Date(event.startsAt).toLocaleString();
  }
};
export const browserDate = (value, timezone = deviceTimezone()) => dateForZone(value, timezone);
export const eventCover = eventMediaUrl;
export const ratingStars = (rating) => {
  const filled = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
};
export const participantPictureUrl = (value) => {
  if (!value) return '';
  if (!/^https?:\/\//i.test(value) && !value.startsWith('/'))
    return apiAssetUrl(`/uploads/profile-pictures/${value}`);
  try {
    const parsed = new URL(value, window.location.origin);
    return parsed.pathname.startsWith('/uploads/profile-pictures/')
      ? apiAssetUrl(parsed.pathname)
      : value;
  } catch {
    return value;
  }
};
export const personPicture = (person) =>
  person?.profilePicture ||
  person?.profilePictureUrl ||
  person?.profile_picture ||
  person?.avatar ||
  '';
export const replaceWithInitial = (avatar, name) => {
  const fallback = document.createElement('div');
  fallback.className = `${avatar.className} bg-secondary text-lg`;
  fallback.textContent = name?.charAt(0)?.toUpperCase() || '?';
  avatar.replaceWith(fallback);
};
export const confirmPayment = () =>
  new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="w-full max-w-md rounded-2xl bg-background p-8 shadow-xl"><h2 class="font-display text-3xl font-semibold">Confirm payment</h2><p class="mt-4 text-muted-foreground">Mark this participant as Paid?</p><div class="mt-7 flex justify-end gap-3"><button data-action="cancel" class="min-h-10 border border-border px-4 text-xs uppercase tracking-widest">Cancel</button><button data-action="confirm" class="min-h-10 bg-primary px-4 text-xs uppercase tracking-widest text-primary-foreground">Mark as Paid</button></div></div>';
    const close = (result) => {
      overlay.remove();
      resolve(result);
    };
    overlay.querySelector('[data-action="cancel"]').onclick = () => close(false);
    overlay.querySelector('[data-action="confirm"]').onclick = () => close(true);
    document.body.appendChild(overlay);
  });
