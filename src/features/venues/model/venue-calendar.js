import { backendInstant, localDateTimeForZone } from '@/shared/utils/time.js';
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const HOURS = Array.from(
  {
    length: 15,
  },
  (_, index) => index + 7,
);
export const auth = () => ({
  Authorization: `Bearer ${localStorage.getItem('authToken')}`,
});
export const input = 'mt-1 min-h-11 w-full border border-border bg-background px-3';
export const errorText = (data, fallback) => data?.error || data?.message || fallback;
export const list = (data, key) => (Array.isArray(data) ? data : data?.[key] || []);
export const isoDate = (date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const atMidnight = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};
export const addDays = (date, amount) => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};
export const startOfWeek = (date) => addDays(atMidnight(date), -atMidnight(date).getDay() + 1);
export const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
export const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
export const time = (value) => String(value || '').slice(0, 5);
export const dateForEntry = (entry) =>
  String(entry.date || entry.startsAt || entry.starts_at || entry.start || '').slice(0, 10);
export const readableDate = (
  date,
  options = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  },
) => new Intl.DateTimeFormat(undefined, options).format(new Date(`${date}T12:00:00`));
export const entryKind = (entry) =>
  String(entry.kind || entry.type || entry.status || '').toLowerCase();
export const statusLabel = (entry) => {
  const kind = entryKind(entry);
  if (kind.includes('request') || kind === 'pending') return 'Booking request';
  if (kind.includes('external') || kind.includes('reservation') || kind === 'manual')
    return 'External reservation';
  if (kind.includes('block') || kind.includes('unavailable')) return 'Blocked';
  if (kind.includes('override')) return 'Date-specific availability';
  if (kind.includes('avail')) return 'Available';
  return kind.includes('past') ? 'Past booking' : 'Confirmed booking';
};
export const entryClass = (entry) => {
  const label = statusLabel(entry);
  if (label === 'Available' || label === 'Date-specific availability')
    return 'border-accent/50 bg-accent/10';
  if (label === 'Booking request') return 'border-amber-600/50 bg-amber-500/10';
  if (label === 'External reservation') return 'border-violet-600/50 bg-violet-500/10';
  if (label === 'Blocked') return 'border-slate-500/50 bg-slate-500/10';
  return 'border-primary/50 bg-primary/10';
};
export const localDateTime = (value, timezone) => {
  if (!value)
    return {
      date: '',
      time: '',
    };
  const local = localDateTimeForZone(backendInstant(value), timezone);
  return local
    ? {
        date: local.slice(0, 10),
        time: local.slice(11, 16),
      }
    : {
        date: String(value).slice(0, 10),
        time: String(value).slice(11, 16),
      };
};
export const calendarEntry = (item, type, timezone) => {
  const start = localDateTime(item.startAt || item.start_at || item.start, timezone);
  const end = localDateTime(item.endAt || item.end_at || item.end, timezone);
  return {
    ...item,
    type,
    date: item.bookingDate || item.booking_date || start.date,
    startTime: start.time,
    endTime: end.time,
    title: item.title || item.reason || item.organizerMessage,
  };
};
export const entriesFromCalendar = (calendar) => {
  const timezone = calendar.timezone;
  const availability = list(calendar, 'availability').flatMap((day) =>
    list(day, 'availableIntervals').map((interval, index) => ({
      id: `availability-${day.date}-${index}`,
      type: 'availability',
      date: day.date,
      startTime: interval.startTime || interval.start,
      endTime: interval.endTime || interval.end,
    })),
  );
  return [
    ...availability,
    ...list(calendar, 'bookingRequests').map((item) => calendarEntry(item, 'request', timezone)),
    ...list(calendar, 'confirmedBookings').map((item) =>
      calendarEntry(item, 'confirmed', timezone),
    ),
    ...list(calendar, 'externalReservations')
      .filter((item) => !item.cancelledAt)
      .map((item) => calendarEntry(item, 'external', timezone)),
    ...list(calendar, 'blocks').map((item) => calendarEntry(item, 'block', timezone)),
  ];
};
export const minutesForTime = (value) => {
  const [hour = 0, minute = 0] = time(value).split(':').map(Number);
  return hour * 60 + minute;
};
export const GRID_START_HOUR = HOURS[0];
export const GRID_HOUR_HEIGHT = 80;
