// One browser-side counterpart to server/time.js.  Date-only values are kept
// as strings; instants are ISO timestamps; venue schedules use local wall time
// in the venue's IANA timezone.

const formatterCache = new Map();

export const deviceTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

export const backendInstant = (value) => {
  if (!value) return null;
  const text = String(value).trim().replace(" ", "T");
  const instant = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(text) ? text : `${text}Z`);
  return Number.isNaN(instant.getTime()) ? null : instant;
};

const formatter = (timeZone, options) => {
  const key = `${timeZone}|${JSON.stringify(options)}`;
  if (!formatterCache.has(key)) formatterCache.set(key, new Intl.DateTimeFormat(undefined, { ...options, timeZone }));
  return formatterCache.get(key);
};

export const zonedParts = (value, timeZone) => {
  const instant = value instanceof Date ? value : typeof value === "number" ? new Date(value) : backendInstant(value);
  if (!instant || !timeZone) return null;
  try {
    return Object.fromEntries(formatter(timeZone, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(instant)
      .filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  } catch { return null; }
};

export const localDateTimeForZone = (value, timeZone) => {
  const parts = zonedParts(value, timeZone);
  return parts ? `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}` : "";
};

export const dateForZone = (value, timeZone) => localDateTimeForZone(value, timeZone).slice(0, 10);

// Browser Date has no IANA-zone constructor. Resolve the actual offset, and
// inspect neighbouring DST offsets. Returns null for a non-existent local time.
export const localDateTimeToUtc = (localDateTime, timeZone, edge = "start") => {
  const match = String(localDateTime || "").match(/^(\d{4}-\d{2}-\d{2})T([0-2]\d:[0-5]\d)$/);
  if (!match || !timeZone) return null;
  const [, date, time] = match;
  const target = `${date} ${time}:00`;
  const nominal = Date.parse(`${localDateTime}:00Z`);
  const matches = (milliseconds) => {
    const parts = zonedParts(new Date(milliseconds), timeZone);
    return parts && `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}` === target;
  };
  const offset = (milliseconds) => {
    const parts = zonedParts(new Date(milliseconds), timeZone);
    return parts ? Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second)) - milliseconds : NaN;
  };
  let candidate = nominal - offset(nominal);
  if (!matches(candidate)) candidate = nominal - offset(candidate);
  if (!matches(candidate)) return null;
  const candidates = [candidate];
  [-180, -120, -60, -30, 30, 60, 120, 180].forEach((minutes) => {
    const alternative = candidate + minutes * 60000;
    if (matches(alternative)) candidates.push(alternative);
  });
  return new Date(edge === "end" ? Math.max(...candidates) : Math.min(...candidates)).toISOString();
};

export const formatEventDateTime = (event, displayTimezone = deviceTimezone()) => {
  const start = backendInstant(event?.startsAt);
  const end = backendInstant(event?.endsAt);
  if (!start) return "To be announced";
  try {
    const display = formatter(displayTimezone, { dateStyle: "medium", timeStyle: "short", timeZoneName: "short" });
    return end ? `${display.format(start)} – ${display.format(end)}` : display.format(start);
  } catch { return end ? `${start.toLocaleString()} – ${end.toLocaleString()}` : start.toLocaleString(); }
};

export const formatVenueTime = (value, venueTimezone) => {
  const instant = backendInstant(value);
  if (!instant) return "";
  try { return formatter(venueTimezone, { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(instant); } catch { return ""; }
};
