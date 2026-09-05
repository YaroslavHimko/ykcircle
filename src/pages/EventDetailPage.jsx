import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Check, X } from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import ForumDiscussion from "@/components/ForumDiscussion";
import { apiAssetUrl, apiFetch } from "@/lib/api";
import { eventImageRenderDebug, eventMediaUrl } from "@/lib/media";
import MapLocation from "@/components/MapLocation";
import { locationLines } from "@/lib/maps";
import { dateForZone, deviceTimezone, localDateTimeForZone, localDateTimeToUtc } from "@/lib/time";

const eventLocation = (event) => {
  if (event?.locationType === "venue") return event.venue || {};
  if (event?.locationType === "custom") return event.location || {};
  return { location: event?.location, address: event?.address, city: event?.city, country: event?.country, latitude: event?.latitude, longitude: event?.longitude, googlePlaceId: event?.googlePlaceId };
};

const eventLocationText = (event) => {
  if (event?.locationType === "online") return "Online event";
  const location = eventLocation(event);
  const lines = locationLines(location, { exact: event?.locationVisibility !== "private" });
  return [event?.locationType === "venue" ? event.venue?.name : "", ...lines].filter(Boolean).join(", ") || "To be announced";
};

const bookingTimeLabel = (booking) => {
  if (!booking?.startAt || !booking?.endAt) return "";
  const options = { hour: "2-digit", minute: "2-digit" };
  const timezone = booking.timezone || booking.venue?.timezone;
  try {
    const formatter = new Intl.DateTimeFormat(undefined, timezone ? { ...options, timeZone: timezone } : options);
    return `${formatter.format(new Date(booking.startAt))}–${formatter.format(new Date(booking.endAt))}`;
  } catch {
    return `${new Date(booking.startAt).toLocaleTimeString([], options)}–${new Date(booking.endAt).toLocaleTimeString([], options)}`;
  }
};
const eventDateTimeLabel = (event) => {
  if (!event?.startsAt) return "To be announced";
  const options = { dateStyle: "medium", timeStyle: "short" };
  try {
    const formatter = new Intl.DateTimeFormat(undefined, options);
    const start = formatter.format(new Date(event.startsAt));
    return event.endsAt ? `${start} – ${formatter.format(new Date(event.endsAt))}` : start;
  } catch {
    return event.endsAt ? `${new Date(event.startsAt).toLocaleString()} – ${new Date(event.endsAt).toLocaleString()}` : new Date(event.startsAt).toLocaleString();
  }
};
const browserDate = (value, timezone = deviceTimezone()) => dateForZone(value, timezone);

function SelectedBookingTimeGrid({ schedule, value }) {
  const slots = schedule.slots || [];
  const unavailable = schedule.unavailableSlots || schedule.unavailableIntervals || [];
  const toMinutes = (time) => { const [hours = 0, minutes = 0] = String(time || "00:00").slice(0, 5).split(":").map(Number); return hours * 60 + minutes; };
  const toTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  const hours = Array.from({ length: 15 }, (_, index) => index + 7);
  const hourHeight = 52;
  const height = hours.length * hourHeight;
  const start = value?.start;
  const end = value?.end;
  return <div className="mt-5 overflow-auto border border-border bg-background" style={{ maxHeight: "30rem" }}><div className="min-w-[19rem]"><div className="grid grid-cols-[4.5rem_1fr] border-b border-border bg-secondary/30"><div className="border-r border-border" /><div className="px-3 py-2 text-sm font-medium">Selected venue time</div></div><div className="grid grid-cols-[4.5rem_1fr]"><div className="relative border-r border-border" style={{ height }}>{hours.map((hour) => <span key={hour} className="absolute right-2 -translate-y-2 text-xs text-muted-foreground" style={{ top: (hour - 7) * hourHeight }}>{toTime(hour * 60)}</span>)}</div><div className="relative" style={{ height }}>{hours.map((hour) => <span key={hour} className="absolute left-0 right-0 border-b border-border/80" style={{ top: (hour - 7) * hourHeight }} />)}{hours.slice(0, -1).map((hour) => <span key={`half-${hour}`} className="absolute left-0 right-0 border-b border-dashed border-border/50" style={{ top: (hour - 6.5) * hourHeight }} />)}{unavailable.map((slot, index) => { const slotStart = toMinutes(slot.startTime || slot.start); const slotEnd = toMinutes(slot.endTime || slot.end); const top = Math.max(0, ((slotStart / 60) - 7) * hourHeight); const bottom = Math.min(height, ((slotEnd / 60) - 7) * hourHeight); return bottom <= top ? null : <div key={`unavailable-${slotStart}-${index}`} className="absolute left-2 right-2 z-[1] border border-slate-500/50 bg-slate-500/20 p-2 text-xs text-muted-foreground" style={{ top: top + 2, height: Math.max(24, bottom - top - 4) }}>Unavailable {toTime(slotStart)}–{toTime(slotEnd)}</div>; })}{slots.map((slot, index) => { const slotStart = toMinutes(slot.startTime || slot.start); const slotEnd = toMinutes(slot.endTime || slot.end); const top = Math.max(0, ((slotStart / 60) - 7) * hourHeight); const bottom = Math.min(height, ((slotEnd / 60) - 7) * hourHeight); return bottom <= top ? null : <div key={`${slotStart}-${index}`} className="absolute left-2 right-2 z-[2] border border-accent/50 bg-accent/10 p-2 text-xs text-muted-foreground" style={{ top: top + 2, height: Math.max(24, bottom - top - 4) }}>Available {toTime(slotStart)}–{toTime(slotEnd)}</div>; })}{Number.isFinite(start) && Number.isFinite(end) && end > start && <div className="pointer-events-none absolute left-3 right-3 z-10 border-2 border-primary bg-primary/25 p-2 text-xs font-semibold text-primary shadow-sm" style={{ top: Math.max(0, ((start / 60) - 7) * hourHeight) + 2, height: Math.max(28, ((end - start) / 60) * hourHeight - 4) }}>Selected: {toTime(start)}–{toTime(end)}</div>}</div></div></div></div>;
}

function VenueBookingTimeSelector({ schedule, value, onChange }) {
  const toMinutes = (time) => { const [hours = 0, minutes = 0] = String(time || "00:00").slice(0, 5).split(":").map(Number); return hours * 60 + minutes; };
  const toTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  const positive = (...values) => values.map(Number).find((number) => Number.isFinite(number) && number > 0);
  const increment = positive(schedule.slotIncrementMinutes, schedule.slotIncrement) || 30;
  const minimum = positive(schedule.minimumDurationMinutes, schedule.minDurationMinutes, schedule.minimumDuration, schedule.minimumBookingMinutes, Number(schedule.minimumBookingHours) * 60) || increment;
  const maximum = positive(schedule.maximumDurationMinutes, schedule.maxDurationMinutes, schedule.maximumDuration, schedule.maximumBookingMinutes, Number(schedule.maximumBookingHours) * 60) || Infinity;
  const interval = value?.interval;
  const intervalStart = toMinutes(interval?.startTime || interval?.start);
  const intervalEnd = toMinutes(interval?.endTime || interval?.end);
  const start = value?.start ?? intervalStart;
  const end = value?.end ?? intervalEnd;
  const startOptions = interval ? Array.from({ length: Math.max(0, Math.floor((intervalEnd - intervalStart - minimum) / increment) + 1) }, (_, index) => intervalStart + index * increment) : [];
  const endOptions = interval ? Array.from({ length: Math.max(0, Math.floor((Math.min(intervalEnd, start + maximum) - start - minimum) / increment) + 1) }, (_, index) => start + minimum + index * increment) : [];
  const selectInterval = (nextInterval) => {
    const nextStart = toMinutes(nextInterval.startTime || nextInterval.start);
    const nextEnd = toMinutes(nextInterval.endTime || nextInterval.end);
    onChange({ interval: nextInterval, start: nextStart, end: nextStart + minimum });
  };
  const updateStart = (nextStart) => {
    const startValue = Number(nextStart);
    const validEnd = end > startValue && end - startValue >= minimum && end - startValue <= maximum && end <= intervalEnd && (end - startValue - minimum) % increment === 0;
    onChange({ ...value, start: startValue, end: validEnd ? end : startValue + minimum });
  };
  return <div className="mt-4">
    <p className="text-sm font-medium">Available intervals</p>
    {schedule.loading ? <p role="status" className="mt-2 text-sm text-muted-foreground">Loading availability…</p> : schedule.error ? <p role="alert" className="mt-2 text-sm text-destructive">{schedule.error}</p> : (schedule.slots?.length || schedule.unavailableSlots?.length || schedule.unavailableIntervals?.length) ? <>
      <div className="mt-3 flex flex-wrap gap-2">{schedule.slots.map((slot, index) => <button key={`${slot.startTime || slot.start}-${index}`} type="button" onClick={() => selectInterval(slot)} className={`border px-3 py-2 text-sm ${interval === slot ? "border-primary bg-primary text-primary-foreground" : "border-accent/50 bg-accent/10"}`}>{String(slot.startTime || slot.start).slice(0, 5)}–{String(slot.endTime || slot.end).slice(0, 5)}</button>)}</div>
      <SelectedBookingTimeGrid schedule={schedule} value={interval ? { start, end } : null} />
      {interval && <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Start<select value={start} onChange={(event) => updateStart(event.target.value)} className="mt-1 min-h-11 w-full border border-border bg-background px-3">{startOptions.map((option) => <option key={option} value={option}>{toTime(option)}</option>)}</select></label><label className="text-sm font-medium">End<select value={end} onChange={(event) => onChange({ ...value, end: Number(event.target.value) })} className="mt-1 min-h-11 w-full border border-border bg-background px-3">{endOptions.map((option) => <option key={option} value={option}>{toTime(option)}</option>)}</select></label></div>}
    </> : <p className="mt-2 text-sm text-muted-foreground">No bookable time is available on this date.</p>}
  </div>;
}

const eventCover = eventMediaUrl;
const ratingStars = (rating) => {
  const filled = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return "★".repeat(filled) + "☆".repeat(5 - filled);
};

const participantPictureUrl = (value) => {
  if (!value) return "";
  if (!/^https?:\/\//i.test(value) && !value.startsWith("/"))
    return apiAssetUrl(`/uploads/profile-pictures/${value}`);
  try {
    const parsed = new URL(value, window.location.origin);
    return parsed.pathname.startsWith("/uploads/profile-pictures/")
      ? apiAssetUrl(parsed.pathname)
      : value;
  } catch {
    return value;
  }
};
const personPicture = (person) =>
  person?.profilePicture || person?.profilePictureUrl || person?.profile_picture || person?.avatar || "";
const replaceWithInitial = (avatar, name) => {
  const fallback = document.createElement("div");
  fallback.className = `${avatar.className} bg-secondary text-lg`;
  fallback.textContent = name?.charAt(0)?.toUpperCase() || "?";
  avatar.replaceWith(fallback);
};
function ParticipantAvatar({ person, className = "" }) {
  const picture = personPicture(person);
  const [failed, setFailed] = useState(false);
  const avatarClass = `participant-avatar inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full object-cover ${className}`;

  if (picture && !failed) {
    return (
      <img
        src={participantPictureUrl(picture)}
        alt=""
        className={avatarClass}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={`${avatarClass} bg-secondary text-lg`} aria-hidden="true">
      {person?.name?.charAt(0)?.toUpperCase() || "?"}
    </span>
  );
}

const confirmPayment = () =>
  new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className =
      "fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML =
      '<div class="w-full max-w-md bg-background p-8 shadow-xl"><h2 class="font-display text-3xl font-semibold">Confirm payment</h2><p class="mt-4 text-muted-foreground">Mark this participant as Paid?</p><div class="mt-7 flex justify-end gap-3"><button data-action="cancel" class="min-h-10 border border-border px-4 text-xs uppercase tracking-widest">Cancel</button><button data-action="confirm" class="min-h-10 bg-primary px-4 text-xs uppercase tracking-widest text-primary-foreground">Mark as Paid</button></div></div>';
    const close = (result) => {
      overlay.remove();
      resolve(result);
    };
    overlay.querySelector('[data-action="cancel"]').onclick = () =>
      close(false);
    overlay.querySelector('[data-action="confirm"]').onclick = () =>
      close(true);
    document.body.appendChild(overlay);
  });

export default function EventDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const manageView = searchParams.get("manage") === "1";
  const token = localStorage.getItem("authToken");
  const user = JSON.parse(localStorage.getItem("authUser") || "null");
  const [event, setEvent] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ratingSaving, setRatingSaving] = useState(false);
  const canManageEvents = Boolean(
    manageView &&
      token &&
      (["manager", "admin"].includes(user?.role) ||
        (user?.id != null &&
          event?.managerId != null &&
          String(event.managerId) === String(user.id))),
  );
  const sanitizeParticipants = (value) => {
    if (canManageEvents || !value?.participants) return value;
    return {
      ...value,
      participants: value.participants.map((participant) => ({
        ...participant,
        isCurrentUser:
          participant.isCurrentUser ||
          (participant.email && participant.email === user?.email) ||
          (participant.userId != null &&
            user?.id != null &&
            String(participant.userId) === String(user.id)) ||
          (participant.user_id != null &&
            user?.id != null &&
            String(participant.user_id) === String(user.id)),
        email: undefined,
        phone: undefined,
      })),
    };
  };
  const [attendance, setAttendance] = useState({});
  const [pendingWithdrawal, setPendingWithdrawal] = useState(false);
  const [participantStatuses, setParticipantStatuses] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [invitationStatuses, setInvitationStatuses] = useState([]);
  const [showInvitationConfirmation, setShowInvitationConfirmation] =
    useState(false);
  const [invitationSent, setInvitationSent] = useState(false);
  const [invitation, setInvitation] = useState({ name: "", email: "" });
  const [invitationMessage, setInvitationMessage] = useState("");
  const [resendingInvitationId, setResendingInvitationId] = useState(null);
  const [pendingRegistration, setPendingRegistration] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [ownRegistration, setOwnRegistration] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [error, setError] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState("");
  const [registered, setRegistered] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [bookingSchedule, setBookingSchedule] = useState({ loading: false, error: "", slots: [], timezone: "" });
  const [bookingTime, setBookingTime] = useState(null);
  const [bookingAvailabilityVersion, setBookingAvailabilityVersion] = useState(0);
  const [bookingSaving, setBookingSaving] = useState(false);
  useEffect(() => {
    if (!error) return undefined;
    const timer = window.setTimeout(() => setError(""), 5000);
    return () => window.clearTimeout(timer);
  }, [error]);
  const sameIdentifier = (left, right) =>
    left !== undefined &&
    left !== null &&
    right !== undefined &&
    right !== null &&
    String(left) === String(right);
  const registrationMatchesEvent = (registration) =>
    Number(
      registration.eventId ??
        registration.event_id ??
        registration.event?.id ??
        registration.event?.eventId,
    ) === Number(id);
  const load = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const eventResponse = await apiFetch(
      `/api/events/${id}`,
      token ? { headers } : {},
    );
    const eventData = await eventResponse.json();
    if (!eventResponse.ok)
      throw new Error(eventData.error || "Unable to load event.");
    if (canManageEvents) {
      const bookingResponse = await apiFetch(`/api/events/${id}/venue-booking`, { headers });
      if (bookingResponse.ok) eventData.venueBooking = await bookingResponse.json();
    }
    const canRequestManagedParticipants = canManageEvents;
    const managedParticipantsResponse = canRequestManagedParticipants
      ? await apiFetch(`/api/events/${id}/participants`, { headers })
      : null;
    const managedParticipants = managedParticipantsResponse?.ok
      ? await managedParticipantsResponse.json()
      : null;
    const publicParticipants = eventData.participants || [];
    const participants = (managedParticipants || publicParticipants)
      .map((participant) => {
        const publicParticipant = publicParticipants.find(
          (item) =>
            (item.id && participant.id && item.id === participant.id) ||
            (item.participantId &&
              participant.participantId &&
              item.participantId === participant.participantId) ||
            (item.name === participant.name && item.email === participant.email),
        );
        return personPicture(participant) || !publicParticipant
          ? participant
          : {
              ...participant,
              profilePicture: personPicture(publicParticipant),
            };
      })
      .sort(
      (a, b) =>
        (new Date(b.createdAt || b.joinedAt).getTime() || 0) -
        (new Date(a.createdAt || a.joinedAt).getTime() || 0),
    );
    setEvent({ ...eventData, participants });
    setAttendance(
      Object.fromEntries(
        participants.map((participant) => [
          participant.id,
          participant.status || "Pending",
        ]),
      ),
    );
    if (canManageEvents) {
      const [
        response,
        statusResponse,
        invitationResponse,
        invitationStatusResponse,
        participantStatusResponse,
      ] = await Promise.all([
        apiFetch(`/api/events/${id}/registrations`, { headers }),
        apiFetch("/api/registration-statuses"),
        apiFetch(`/api/events/${id}/invitations`, { headers }),
        apiFetch("/api/invitation-statuses"),
        apiFetch("/api/participant-statuses"),
      ]);
      const data = await response.json();
      const statusData = await statusResponse.json();
      const invitationData = await invitationResponse.json();
      const invitationStatusData = await invitationStatusResponse.json();
      const participantStatusData = await participantStatusResponse.json();
      if (
        !response.ok ||
        !statusResponse.ok ||
        !invitationResponse.ok ||
        !invitationStatusResponse.ok ||
        !participantStatusResponse.ok
      )
        throw new Error(
          data.error ||
            invitationData.error ||
            "Unable to load event management data.",
        );
      const managedRegistrations = [...data].sort(
        (a, b) =>
          (new Date(b.createdAt).getTime() || 0) -
          (new Date(a.createdAt).getTime() || 0),
      );
      setRegistrations(
        managedRegistrations.filter(
          (registration) => registration.status !== "Confirmed",
        ),
      );
      setEvent((current) =>
        current
          ? {
              ...current,
              participants: (current.participants || []).map((participant) => {
                const registration = managedRegistrations.find(
                  (item) =>
                    item.participantId === participant.id ||
                    item.name === participant.name ||
                    item.email === participant.email,
                );
                return registration
                  ? {
                      ...participant,
                      email: participant.email || registration.email,
                      phone: participant.phone || registration.phone,
                      profilePicture:
                        personPicture(participant) ||
                        personPicture(registration),
                      paymentStatus:
                        participant.paymentStatus ||
                        participant.registrationPaymentStatus ||
                        registration.paymentStatus ||
                        registration.registrationPaymentStatus,
                    }
                  : participant;
              }),
            }
          : current,
      );
      setStatuses(statusData);
      setInvitations(
        [...invitationData].sort(
          (a, b) =>
            (new Date(b.createdAt).getTime() || 0) -
            (new Date(a.createdAt).getTime() || 0),
        ),
      );
      setInvitationStatuses(invitationStatusData);
      setParticipantStatuses(participantStatusData);
    }
    if (token) {
      const response = await apiFetch("/api/my/registrations", { headers });
      const data = await response.json();
      if (response.ok) {
        if (!canManageEvents)
          setRegistrations(
            [...data].sort(
              (a, b) =>
                (new Date(b.createdAt).getTime() || 0) -
                (new Date(a.createdAt).getTime() || 0),
            ),
          );
        const ownRegistration =
          data.find(registrationMatchesEvent) ||
          data.find((registration) =>
            participants.some((participant) =>
              sameIdentifier(
                participant.id ?? participant.participantId,
                registration.participantId ?? registration.participant_id,
              ),
            ),
          );
        setOwnRegistration(ownRegistration || null);
        setRegistrationStatus(ownRegistration?.status || "");
        setRegistered(
          Boolean(
            ownRegistration &&
              String(ownRegistration.status).toLowerCase() !== "withdrawn",
          ),
        );
      }
    }
  };
  useEffect(() => {
    load()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [id, token, canManageEvents]);
  useEffect(() => {
    if (!canManageEvents) return;
    apiFetch("/api/venues", { headers: { Authorization: `Bearer ${token}` } }).then(async (response) => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load venues.");
      setVenues((Array.isArray(data) ? data : data.venues || []).filter((venue) => venue.isActive !== false));
    }).catch((requestError) => setError(requestError.message));
  }, [canManageEvents, token]);
  const venueBooking = event?.venueBooking || event?.venue_booking || event?.booking;
  const scheduleVenueId = selectedVenueId || venueBooking?.venueId || event?.venue?.id || event?.venueId || "";
  const selectedVenue = venues.find((venue) => String(venue.id) === String(scheduleVenueId));
  const bookingTimezone = bookingSchedule.timezone || venueBooking?.timezone || selectedVenue?.timezone || event?.venue?.timezone || event?.timezone || deviceTimezone();
  const bookingDate = browserDate(venueBooking?.startAt || event?.startsAt, bookingTimezone);
  const persistedBookingTime = venueBooking?.startAt && venueBooking?.endAt ? (() => {
    const toMinutes = (value) => { const [hours, minutes] = value.slice(11, 16).split(":").map(Number); return hours * 60 + minutes; };
    const start = localDateTimeForZone(venueBooking.startAt, bookingTimezone);
    const end = localDateTimeForZone(venueBooking.endAt, bookingTimezone);
    return start && end ? { start: toMinutes(start), end: toMinutes(end) } : null;
  })() : null;
  useEffect(() => {
    let cancelled = false;
    setBookingTime(null);
    if (!canManageEvents || !scheduleVenueId || !bookingDate) {
      setBookingSchedule({ loading: false, error: bookingDate ? "" : "Set an event date before requesting a venue.", slots: [], timezone: "" });
      return undefined;
    }
    setBookingSchedule({ loading: true, error: "", slots: [], timezone: "" });
    apiFetch(`/api/venues/${scheduleVenueId}/availability?date=${encodeURIComponent(bookingDate)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || "Unable to load venue availability.");
        if (!cancelled) setBookingSchedule({ ...data, loading: false, error: "", slots: data.slots || data.availableIntervals || [], timezone: data.timezone || "" });
      })
      .catch((requestError) => !cancelled && setBookingSchedule({ loading: false, error: requestError.message, slots: [], timezone: "" }));
    return () => { cancelled = true; };
  }, [bookingAvailabilityVersion, bookingDate, canManageEvents, scheduleVenueId, token]);
  const requestVenueBooking = async () => { if (!selectedVenueId) return setError("Choose a venue first."); if (!bookingTime) return setError("Choose an available start and end time first."); setBookingSaving(true); try { const toTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`; const startsAtUtc = localDateTimeToUtc(`${bookingDate}T${toTime(bookingTime.start)}`, bookingTimezone); const endsAtUtc = localDateTimeToUtc(`${bookingDate}T${toTime(bookingTime.end)}`, bookingTimezone, "end"); if (!startsAtUtc || !endsAtUtc) throw new Error("This local time does not exist due to daylight saving time. Choose another time."); const eventResponse = await apiFetch(`/api/events/${id}/schedule`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ startsAtUtc, endsAtUtc, venueId: Number(selectedVenueId) }) }); const eventData = await eventResponse.json(); if (!eventResponse.ok) throw new Error(eventData.error || eventData.message || "Unable to set the event time."); const response = await apiFetch(`/api/events/${id}/venue-booking`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ venueId: Number(selectedVenueId) }) }); const data = await response.json(); if (!response.ok) { if (response.status === 409) { setBookingTime(null); setBookingAvailabilityVersion((version) => version + 1); } throw new Error(data.error || data.message || "That time is no longer available. Please choose another time."); } setEvent((current) => ({ ...current, ...(eventData.event || eventData), venueBooking: data.booking || data })); } catch (requestError) { setError(requestError.message); } finally { setBookingSaving(false); } };
  const cancelVenueBooking = async () => { setBookingSaving(true); try { const response = await apiFetch(`/api/events/${id}/venue-booking/cancel`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }); const data = await response.json(); if (!response.ok) throw new Error(data.error || data.message || "Unable to cancel venue booking."); setEvent((current) => ({ ...current, venueBooking: data.booking || { ...venueBooking, status: "cancelled" } })); } catch (requestError) { setError(requestError.message); } finally { setBookingSaving(false); } };
  useEffect(
    () => setImageLoaded(false),
    [id, event?.coverImage, event?.coverImageUrl],
  );
  useEffect(() => {
    setEvent((current) => sanitizeParticipants(current));
  }, [canManageEvents]);
  useEffect(() => {
    event?.participants?.forEach((participant) => {
      const participantsSection = [
        ...document.querySelectorAll("section"),
      ].find(
        (section) =>
          section.querySelector("h2")?.textContent === "Participants",
      );
      const nameNode = [
        ...(participantsSection?.querySelectorAll("p") || []),
      ].find(
        (node) =>
          node.textContent === participant.name &&
          !node.previousElementSibling?.classList.contains(
            "participant-avatar",
          ),
      );
      if (!nameNode) return;
      const participantPaymentStatus =
        participant.paymentStatus ||
        registrations.find(
          (registration) => registration.participantId === participant.id,
        )?.paymentStatus;
      const hasPaymentDetails = nameNode.parentElement?.querySelector(
        ".participant-payment",
      );
      if (
        nameNode.parentElement?.querySelector(".participant-avatar") &&
        (!canManageEvents || event?.fee <= 0 || hasPaymentDetails)
      )
        return;
      const picture = personPicture(participant);
      const avatar = picture
        ? document.createElement("img")
        : document.createElement("div");
      avatar.className =
        "participant-avatar mr-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full object-cover align-middle";
      if (picture) {
        avatar.src = participantPictureUrl(picture);
        avatar.alt = "";
        avatar.onerror = () => {
          avatar.onerror = null;
          replaceWithInitial(avatar, participant.name);
        };
      } else {
        avatar.textContent = participant.name?.charAt(0)?.toUpperCase() || "?";
        avatar.className += " bg-secondary text-lg";
      }
      const card = nameNode.parentNode;
      const details = nameNode.parentElement;
      details.querySelector(".participant-avatar")?.remove();
      details.insertBefore(avatar, nameNode);
      card.classList.add("items-start", "participant-details");
      if (
        canManageEvents &&
        event?.fee > 0 &&
        participantPaymentStatus &&
        participantPaymentStatus !== "Not Required"
      ) {
        const payment = document.createElement("p");
        payment.className = `participant-payment mt-2 text-xs font-medium ${participantPaymentStatus === "Paid" ? "text-green-700" : "text-red-700"}`;
        payment.textContent =
          participantPaymentStatus === "Paid" ? "Paid" : "Payment Required";
        details.appendChild(payment);
        const paymentSelect = document.createElement("select");
        paymentSelect.className = "hidden";
        paymentSelect.disabled = true;
        ["Not Required", "Payment Required"].forEach((status) => {
          const option = document.createElement("option");
          option.value = status;
          option.textContent = status;
          option.selected = status === participantPaymentStatus;
          paymentSelect.appendChild(option);
        });
        if (participantPaymentStatus === "Paid") {
          const option = document.createElement("option");
          option.value = "Paid";
          option.textContent = "Paid";
          option.selected = true;
          paymentSelect.appendChild(option);
        }
        paymentSelect.onchange = async () => {
          paymentSelect.disabled = true;
          try {
            const response = await apiFetch(
              `/api/participants/${participant.id}/payment-status`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: paymentSelect.value }),
              },
            );
            const data = await response.json();
            if (!response.ok)
              throw new Error(data.error || "Unable to update payment status.");
            payment.textContent = `Payment: ${data.status || paymentSelect.value}`;
          } catch (requestError) {
            setError(requestError.message);
            paymentSelect.value = participantPaymentStatus;
          } finally {
            paymentSelect.disabled = false;
          }
        };
        details.appendChild(paymentSelect);
        if (event?.fee > 0 && participantPaymentStatus === "Payment Required") {
          const paidButton = document.createElement("button");
          paidButton.type = "button";
          paidButton.textContent = "Mark as Paid";
          paidButton.className =
            "mt-2 inline-flex min-h-9 items-center justify-center border border-primary px-3 text-xs uppercase tracking-widest text-primary";
          paidButton.onclick = async () => {
            if (!(await confirmPayment())) return;
            paidButton.disabled = true;
            try {
              const response = await apiFetch(
                `/api/participants/${participant.id}/payment-status`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ status: "Paid" }),
                },
              );
              const data = await response.json();
              if (!response.ok)
                throw new Error(
                  data.error || "Unable to update payment status.",
                );
              payment.textContent = `Payment: ${data.status || "Paid"}`;
              payment.className = "participant-payment mt-2 text-xs font-medium text-green-700";
              paymentSelect.value = "Paid";
              paymentSelect.disabled = true;
              paidButton.remove();
            } catch (requestError) {
              setError(requestError.message);
              paidButton.disabled = false;
            }
          };
          details.appendChild(paidButton);
        }
      }
    });
  }, [event?.participants, event?.fee, canManageEvents, registrations]);
  useEffect(() => {
    registrations.forEach((registration) => {
      const registrationsSection = [
        ...document.querySelectorAll("section"),
      ].find(
        (section) =>
          section.querySelector("h2")?.textContent === "Registrations",
      );
      const nameNode = [
        ...(registrationsSection?.querySelectorAll("p") || []),
      ].find((node) => node.textContent === registration.name);
      if (!nameNode) return;
      if (nameNode.parentElement?.querySelector(".registration-avatar")) return;
      let card = nameNode.parentElement;
      while (card && !card.textContent.includes("Confirm"))
        card = card.parentElement;
      if (
        !card ||
        card.querySelector(".registration-avatar") ||
        card.querySelector(".registration-payment")
      )
        return;
      const picture = personPicture(registration);
      const avatar = picture
        ? document.createElement("img")
        : document.createElement("div");
      avatar.className =
        "registration-avatar mr-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full object-cover align-middle";
      if (picture) {
        avatar.src = participantPictureUrl(picture);
        avatar.alt = "";
        avatar.onerror = () => {
          avatar.onerror = null;
          replaceWithInitial(avatar, registration.name);
        };
      } else {
        avatar.textContent = registration.name?.charAt(0)?.toUpperCase() || "?";
        avatar.className += " bg-secondary text-lg";
      }
      nameNode.parentNode.insertBefore(avatar, nameNode);
      if (canManageEvents && event?.fee > 0) {
        const payment = document.createElement("span");
        const registrationPaymentStatus =
          registration.paymentStatus || "Payment Required";
        payment.className = `registration-payment ml-auto text-xs font-medium ${registrationPaymentStatus === "Paid" ? "text-green-700" : "text-red-700"}`;
        payment.textContent =
          registrationPaymentStatus === "Paid" ? "Paid" : "Payment Required";
        card.classList.add("items-center");
        card.appendChild(payment);
        if (registrationPaymentStatus === "Payment Required") {
          const paidButton = document.createElement("button");
          paidButton.type = "button";
          paidButton.textContent = "Mark as Paid";
          paidButton.className =
            "inline-flex min-h-9 items-center justify-center border border-primary px-3 text-xs uppercase tracking-widest text-primary";
          paidButton.onclick = async () => {
            if (!(await confirmPayment())) return;
            paidButton.disabled = true;
            try {
              const response = await apiFetch(
                `/api/registrations/${registration.id}/payment-status`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ status: "Paid" }),
                },
              );
              const data = await response.json();
              if (!response.ok)
                throw new Error(
                  data.error || "Unable to update payment status.",
                );
              payment.textContent = `Payment: ${data.status || "Paid"}`;
              payment.className = "registration-payment ml-auto text-xs font-medium text-green-700";
              paidButton.remove();
            } catch (requestError) {
              setError(requestError.message);
              paidButton.disabled = false;
            }
          };
          card.appendChild(paidButton);
        }
      }
    });
  }, [registrations, event?.fee, canManageEvents]);
  useEffect(() => {
    setEvent((current) =>
      current
        ? {
            ...current,
            location: current.location,
          }
        : current,
    );
  }, [event?.fee]);
  const register = () => {
    if (!token) {
      window.location.assign(
        `/login?from=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    setConfirmationMessage("Are you sure you want to register for this event?");
    setPendingRegistration(true);
    setShowConfirmation(true);
  };
  const confirmRegistration = async () => {
    const response = await apiFetch(`/api/events/${id}/registrations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to register for event.");
      setShowConfirmation(false);
      return;
    }
    setRegistered(true);
    setRegistrationStatus("Pending");
    await load();
    setPendingRegistration(false);
    setConfirmationMessage(
      "Your registration request has been sent. The event organiser will review your application and contact you with the outcome.",
    );
  };
  const withdraw = () => {
    confirmWithdrawal();
  };
  const confirmWithdrawal = async () => {
    const response = await apiFetch(
      `/api/events/${id}/withdraw`,
      { method: "PATCH", headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to withdraw registration.");
      setShowConfirmation(false);
      return;
    }
    setRegistered(false);
    setRegistrationStatus("Withdrawn");
    setOwnRegistration((current) =>
      current ? { ...current, status: data.status || "Withdrawn" } : current,
    );
    setRegistrations((current) =>
      current.map((item) =>
        registrationMatchesEvent(item)
          ? { ...item, status: data.status || "Withdrawn" }
          : item,
      ),
    );
    await load();
    setPendingWithdrawal(false);
    setConfirmationMessage(
      "Your participation in this event has been withdrawn.",
    );
    setShowConfirmation(true);
  };
  const sendInvitation = (submitEvent) => {
    submitEvent.preventDefault();
    setInvitationSent(false);
    setInvitationMessage(
      `Send an invitation to ${invitation.name} at ${invitation.email}?`,
    );
    setShowInvitationConfirmation(true);
  };
  const confirmInvitation = async () => {
    setInvitationMessage("Sending invitation...");
    const response = await apiFetch(`/api/events/${id}/invitations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invitation),
    });
    const data = await response.json();
    if (!response.ok) {
      setInvitationMessage(data.error || "Unable to send invitation.");
      return;
    }
    setInvitation({ name: "", email: "" });
    await load();
    setInvitationSent(true);
    setInvitationMessage("Invitation sent successfully.");
  };
  const updateParticipantStatus = async (participantId, status) => {
    const response = await apiFetch(
      `/api/participants/${participantId}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to update participant status.");
      return;
    }
    setAttendance((current) => ({ ...current, [participantId]: status }));
    load().catch((requestError) => setError(requestError.message));
  };
  const updateInvitationStatus = async (invitationId, status) => {
    const response = await apiFetch(
      `/api/events/${id}/invitations/${invitationId}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to update invitation.");
      return;
    }
    load().catch((requestError) => setError(requestError.message));
  };
  const resendInvitation = async (invitationId) => {
    setResendingInvitationId(invitationId);
    setError("");
    try {
      const response = await apiFetch(
        `/api/events/${id}/invitations/${invitationId}/resend`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to resend invitation.");
      setInvitationMessage(data.message || "Invitation resent.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setResendingInvitationId(null);
    }
  };
  const markRegistrationPaid = async (registrationId) => {
    if (!(await confirmPayment())) return;
    const response = await apiFetch(
      `/api/registrations/${registrationId}/payment-status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Paid" }),
      },
    );
    const data = await response.json();
    if (!response.ok)
      return setError(data.error || "Unable to update payment status.");
    setRegistrations((current) =>
      current.map((registration) =>
        registration.id === registrationId
          ? { ...registration, paymentStatus: data.status || "Paid" }
          : registration,
      ),
    );
  };
  const participantPaymentStatus = (participant) => {
    const registration = registrations.find(
      (item) =>
        sameIdentifier(
          item.participantId ?? item.participant_id,
          participant.id ?? participant.participantId,
        ) ||
        (item.name && participant.name && item.name === participant.name),
    );
    return (
      participant.paymentStatus ||
      participant.registrationPaymentStatus ||
      registration?.paymentStatus ||
      registration?.registrationPaymentStatus ||
      (event?.fee > 0 ? "Payment Required" : "Not Required")
    );
  };
  const markParticipantPaid = async (participantId) => {
    if (!(await confirmPayment())) return;
    const response = await apiFetch(
      `/api/participants/${participantId}/payment-status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Paid" }),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to update payment status.");
      return;
    }
    setEvent((current) =>
      current
        ? {
            ...current,
            participants: (current.participants || []).map((participant) =>
              sameIdentifier(participant.id, participantId)
                ? { ...participant, paymentStatus: data.status || "Paid" }
                : participant,
            ),
          }
        : current,
    );
  };
  const updateStatus = async (registrationId, status) => {
    const response = await apiFetch(
      `/api/registrations/${registrationId}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to update registration.");
      return;
    }
    load().catch((requestError) => setError(requestError.message));
  };
  const isCurrentParticipant = (participant) => {
    const currentRegistration =
      ownRegistration || registrations.find(registrationMatchesEvent);
    return Boolean(
      user &&
        (participant.isCurrentUser ||
          sameIdentifier(participant.userId ?? participant.user_id, user.id) ||
          sameIdentifier(
            participant.id,
            currentRegistration?.participantId ?? currentRegistration?.participant_id,
          ) ||
          sameIdentifier(
            participant.participantId,
            currentRegistration?.participantId ?? currentRegistration?.participant_id,
          ) ||
          (participant.email && participant.email === user.email)),
    );
  };
  const currentUserParticipates =
    registered ||
    (!registrations.some(registrationMatchesEvent) &&
      Boolean(event?.participants?.some(isCurrentParticipant)));
  const currentParticipant = event?.participants?.find(isCurrentParticipant);
  const currentParticipantAttendance = String(
    event?.myParticipantStatus ?? attendance[currentParticipant?.id] ?? currentParticipant?.status ?? "",
  )
    .replace(/\s/g, "")
    .toLowerCase();
  const canWithdraw =
    currentUserParticipates &&
    !["attended", "noshow"].includes(currentParticipantAttendance);
  const canRate = Boolean(token && currentParticipantAttendance === "attended");
  const saveRating = async (rating) => {
    if (!canRate || ratingSaving) return;
    setRatingSaving(true);
    setError("");
    try {
      const response = await apiFetch(`/api/events/${id}/rating`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save your rating.");
      setEvent((current) => current ? { ...current, ...data } : current);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRatingSaving(false);
    }
  };
  return (
    <SiteChrome>
      <Helmet>
        <title>{event?.title || "Event"} | Yaro Himko</title>
      </Helmet>
      <section className="mx-auto max-w-[72rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <Link to={manageView ? "/profile/events" : "/events"} className="text-sm text-primary underline">
          Back to {manageView ? "manage events" : "all events"}
        </Link>
        {loading && (
          <div className="mt-12 flex items-center gap-3 text-muted-foreground">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
              aria-hidden="true"
            />
            Loading event details…
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="fixed bottom-6 left-5 z-50 max-w-md border border-destructive/30 bg-background px-4 py-3 text-sm text-destructive shadow-lg sm:left-auto sm:right-6"
          >
            {error}
          </p>
        )}
        {event && (
          <>
            <p className="mt-10 text-[0.7rem] uppercase tracking-[0.35em] text-primary">
              {event.status}
            </p>
            {event.groupName && (
              <Link to={`/groups/${event.groupId}`} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                From {event.groupName}
              </Link>
            )}
            <h1 className="mt-3 font-display text-5xl font-black">
              {event.title}
            </h1>
            {eventCover(event) && (
              <div className="relative mt-8 aspect-[16/7] w-full overflow-hidden bg-secondary">
                {!imageLoaded && (
                  <div
                    className="absolute inset-0 animate-pulse bg-gradient-to-r from-secondary via-muted to-secondary"
                    aria-label="Loading event image"
                  />
                )}
                {eventImageRenderDebug({ component: "EventDetailPage", event })}
                <img
                  src={eventCover(event)}
                  alt={`${event.title} cover`}
                  onLoad={() => setImageLoaded(true)}
                  className={`h-full w-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                />
              </div>
            )}
            <p className="mt-5 text-muted-foreground">
              {eventDateTimeLabel(event)} ·{" "}
              {venueBooking?.status === "confirmed" ? (venueBooking.venue?.name || venueBooking.venueName || event.venue?.name || eventLocationText(event)) : eventLocationText(event)}
            </p>
            {venueBooking?.status === "confirmed" && <p className="mt-2 text-sm text-muted-foreground">Confirmed venue: {venueBooking.venue?.name || venueBooking.venueName}{(venueBooking.venue?.location || venueBooking.venueLocation) && ` — ${venueBooking.venue?.location || venueBooking.venueLocation}`}</p>}
            {bookingTimeLabel(venueBooking) && <p className="mt-2 text-sm text-muted-foreground">Requested time: {bookingTimeLabel(venueBooking)}</p>}
            {canManageEvents && <section className="mt-8 max-w-2xl border border-border p-5"><h2 className="font-display text-2xl font-semibold">Venue booking</h2>{venueBooking ? <><p className="mt-2 text-sm">Status: <span className="capitalize text-primary">{venueBooking.status}</span>{venueBooking.ownerNote && ` — ${venueBooking.ownerNote}`}</p>{persistedBookingTime && <><p className="mt-4 text-sm font-medium text-primary">Current booking</p><SelectedBookingTimeGrid schedule={bookingSchedule} value={persistedBookingTime} /></>}{bookingSchedule.loading && <p role="status" className="mt-3 text-sm text-muted-foreground">Loading venue availability…</p>}{bookingSchedule.timezone && <p className="mt-3 text-xs text-muted-foreground">Venue time: {bookingSchedule.timezone}</p>}{["pending", "confirmed"].includes(venueBooking.status) && <button type="button" disabled={bookingSaving} onClick={cancelVenueBooking} className="mt-4 border border-border px-4 py-2 text-sm disabled:opacity-60">Cancel booking request</button>}</> : <><p className="mt-2 text-sm text-muted-foreground">Choose a venue, then select a bookable start and end time. The request remains subject to the backend confirmation check.</p><label className="mt-4 block text-sm font-medium">Venue<select value={selectedVenueId} onChange={(event) => setSelectedVenueId(event.target.value)} className="mt-2 min-h-11 w-full border border-border bg-background px-3"><option value="">Choose a venue</option>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}{venue.city ? ` — ${venue.city}` : ""}</option>)}</select></label>{selectedVenueId && <VenueBookingTimeSelector schedule={bookingSchedule} value={bookingTime} onChange={setBookingTime} />}{bookingSchedule.timezone && <p className="mt-3 text-xs text-muted-foreground">Venue time: {bookingSchedule.timezone}</p>}<button type="button" disabled={bookingSaving || !bookingTime} onClick={requestVenueBooking} className="mt-4 bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">Request booking</button></>}</section>}
            {event.description && (
              <p className="mt-6 max-w-2xl leading-relaxed">
                {event.description}
              </p>
            )}
            <div className="mt-8 grid gap-4 border-y border-border py-6 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Category</span>
                <br />
                {event.categoryName || event.category || "Experience"}
              </p>
              <p>
                <span className="text-muted-foreground">Type</span>
                <br />
                {event.typeName || event.type || "Event"}
              </p>
              {Number(event.ratingCount) > 0 && (
                <p>
                  <span className="text-muted-foreground">Rating</span>
                  <br />
                  <span className="text-primary" aria-hidden="true">{ratingStars(event.ratingAverage)}</span>{" "}
                  {Number(event.ratingAverage).toFixed(1)} / 5 ({event.ratingCount} {Number(event.ratingCount) === 1 ? "rating" : "ratings"})
                </p>
              )}
              <p>
                <span className="text-muted-foreground">Date and time</span>
                <br />
                {eventDateTimeLabel(event)}
              </p>
              <p>
                <span className="text-muted-foreground">Price</span>
                <br />
                {event.fee > 0
                  ? `${event.fee} ${event.currency || "SEK"}`
                  : "Free"}
              </p>
              <p>
                <span className="text-muted-foreground">Capacity</span>
                <br />
                {event.capacity || "No limit specified"}
              </p>
              <p>
                <span className="text-muted-foreground">Language</span>
                <br />
                {event.languageCode || "Not specified"}
              </p>
              <p>
                <span className="text-muted-foreground">Location</span>
                <br />
                {eventLocationText(event)}
              </p>
              <p>
                <span className="text-muted-foreground">
                  Registration deadline
                </span>
                <br />
                {event.registrationDeadline
                  ? new Date(event.registrationDeadline).toLocaleString()
                  : "No deadline specified"}
              </p>
              {event.minimumAge && (
                <p>
                  <span className="text-muted-foreground">Minimum age</span>
                  <br />
                  {event.minimumAge}+
                </p>
              )}
            </div>
            <section className="mt-8 max-w-2xl border-t border-border pt-7">
              <h2 className="font-display text-2xl font-semibold">Location</h2>
              {event.locationType === "online" ? <p className="mt-3 text-muted-foreground">Online event</p> : <>
                {event.locationType === "venue" && event.venue?.name && <p className="mt-3 font-medium">{event.venue.name}</p>}
                <p className="mt-2 whitespace-pre-line text-muted-foreground">{locationLines(eventLocation(event), { exact: event.locationVisibility !== "private" }).join("\n") || "Location to be announced"}</p>
                <MapLocation location={eventLocation(event)} label={event.venue?.name || event.title} hidden={event.locationVisibility === "private" || event.venue?.locationVisibility === "private" || event.venue?.locationVisibility === "private_until_booking"} />
                {event.locationType === "venue" && event.venue?.id && <Link className="mt-4 inline-block text-sm text-primary underline" to={event.venue.slug ? `/venues/slug/${event.venue.slug}` : `/venues/${event.venue.id}`}>View venue</Link>}
              </>}
            </section>
            {event.whatToBring && (
              <section className="mt-8">
                <h2 className="font-display text-3xl font-semibold">
                  What to bring
                </h2>
                <p className="mt-4 leading-relaxed">{event.whatToBring}</p>
              </section>
            )}
            {event.meetingInstructions && (
              <section className="mt-8">
                <h2 className="font-display text-3xl font-semibold">
                  Meeting instructions
                </h2>
                <p className="mt-4 leading-relaxed">
                  {event.meetingInstructions}
                </p>
              </section>
            )}
            {token && Number(event.myRating) > 0 && !canRate && (
              <section className="mt-8 border border-border p-5">
                <h2 className="font-display text-2xl font-semibold">Your rating</h2>
                <p className="mt-2 text-sm text-muted-foreground"><span className="text-primary" aria-hidden="true">{ratingStars(event.myRating)}</span> You rated this event {event.myRating} / 5.</p>
              </section>
            )}
            {canRate && (
              <section className="mt-8 border border-border p-5">
                <h2 className="font-display text-2xl font-semibold">Rate this event</h2>
                <p className="mt-2 text-sm text-muted-foreground">Your rating is visible in the event and group averages. You can change it later.</p>
                <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Choose a rating from one to five">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button key={rating} type="button" disabled={ratingSaving} onClick={() => saveRating(rating)} aria-label={`${rating} stars`} aria-pressed={Number(event.myRating) === rating} className={`min-h-11 min-w-11 border px-3 text-sm disabled:opacity-50 ${Number(event.myRating) === rating ? "border-primary bg-primary text-primary-foreground" : "border-border text-primary"}`}>
                      {ratingStars(rating)}
                    </button>
                  ))}
                </div>
              </section>
            )}
            {
              <section className="mt-12">
                <h2 className="font-display text-3xl font-semibold">
                  Participants
                </h2>
                {event.participants?.length ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {event.participants.map((participant) => {
                      const isYou = isCurrentParticipant(participant);
                      const paymentStatus = participantPaymentStatus(participant);
                      return (
                      <div
                        key={participant.id}
                        className={`border p-4 ${isYou ? "border-primary ring-1 ring-primary/30" : "border-border"}`}
                      >
                        <div className="flex items-center gap-3">
                          <ParticipantAvatar person={participant} />
                          <p className="font-medium">{participant.name}</p>
                        </div>
                        {canManageEvents && participant.email && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {participant.email}
                          </p>
                        )}
                        {canManageEvents && participant.phone && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {participant.phone}
                          </p>
                        )}
                        {participant.joinedAt && (
                          <p className="mt-3 text-xs text-muted-foreground">
                            Joined{" "}
                            {new Date(
                              participant.joinedAt,
                            ).toLocaleDateString()}
                          </p>
                        )}
                        {canManageEvents &&
                          event.fee > 0 &&
                          paymentStatus !== "Not Required" && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span
                                className={`participant-payment text-xs font-medium ${paymentStatus === "Paid" ? "text-green-700" : "text-red-700"}`}
                              >
                                {paymentStatus === "Paid"
                                  ? "Paid"
                                  : "Payment required"}
                              </span>
                              {paymentStatus !== "Paid" && (
                                <button
                                  type="button"
                                  onClick={() => markParticipantPaid(participant.id)}
                                  className="inline-flex min-h-9 items-center justify-center border border-primary px-3 text-xs uppercase tracking-widest text-primary"
                                >
                                  Mark as Paid
                                </button>
                              )}
                            </div>
                          )}
                        {canManageEvents &&
                          (attendance[participant.id] === "Attended" ? (
                            <span
                              className="mt-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-xl font-bold text-white"
                              aria-label="Attended"
                            >
                              <Check className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : attendance[participant.id] === "No Show" ? (
                            <span
                              className="mt-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-xl font-bold text-white"
                              aria-label="No show"
                            >
                              <X className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : (
                            <div className="mt-4 flex gap-2">
                              <button
                                onClick={() =>
                                  updateParticipantStatus(
                                    participant.id,
                                    "Attended",
                                  )
                                }
                                className="min-h-9 border border-green-600 px-3 text-xs uppercase tracking-widest text-green-700"
                              >
                                Attended
                              </button>
                              <button
                                onClick={() =>
                                  updateParticipantStatus(
                                    participant.id,
                                    "No Show",
                                  )
                                }
                                className="min-h-9 border border-red-600 px-3 text-xs uppercase tracking-widest text-red-700"
                              >
                                No Show
                              </button>
                            </div>
                          ))}
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 text-muted-foreground">
                    No participants yet.
                  </p>
                )}
                {canWithdraw && (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border border-border bg-secondary/30 p-4">
                    <div>
                      <p className="font-medium">You’re participating in this event</p>
                      <p className="mt-1 text-sm text-muted-foreground">Need to change your plans?</p>
                    </div>
                    <button
                      type="button"
                      onClick={withdraw}
                      className="min-h-10 border border-destructive px-4 text-xs uppercase tracking-widest text-destructive"
                    >
                      Withdraw
                    </button>
                  </div>
                )}
              </section>
            }
            {!canManageEvents && (
              <div className="mt-8 flex flex-wrap gap-3">
                {!currentUserParticipates && <button
                  onClick={register}
                  className="min-h-12 bg-primary px-7 text-sm uppercase tracking-widest text-primary-foreground"
                >
                  Register
                </button>}
              </div>
            )}
            <div className="mt-5">
              <Link
                to={`/report?entityType=event&entityId=${encodeURIComponent(event.id)}&contentUrl=${encodeURIComponent(window.location.href)}`}
                className="inline-flex min-h-10 items-center border border-border px-4 text-xs uppercase tracking-widest text-muted-foreground hover:border-destructive hover:text-destructive"
              >
                Report event
              </Link>
            </div>
            {(canManageEvents || currentUserParticipates) && <ForumDiscussion title="Event discussion" basePath={`/api/events/${event.id}/threads`} token={token} canPost={Boolean(token)} canModerate={canManageEvents} emptyText="No event discussions yet." />}
            {canManageEvents && (
              <>
                <h2 className="mt-14 font-display text-3xl font-semibold">
                  Invite a participant
                </h2>
                <form
                  onSubmit={sendInvitation}
                  className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <input
                    required
                    placeholder="Name"
                    value={invitation.name}
                    onChange={(e) =>
                      setInvitation((current) => ({
                        ...current,
                        name: e.target.value,
                      }))
                    }
                    className="min-h-12 border border-border bg-background px-4"
                  />
                  <input
                    required
                    type="email"
                    placeholder="Email address"
                    value={invitation.email}
                    onChange={(e) =>
                      setInvitation((current) => ({
                        ...current,
                        email: e.target.value,
                      }))
                    }
                    className="min-h-12 border border-border bg-background px-4"
                  />
                  <button className="min-h-12 bg-primary px-5 text-sm uppercase tracking-widest text-primary-foreground">
                    Send invitation
                  </button>
                </form>
                {invitationMessage && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {invitationMessage}
                  </p>
                )}
                <h2 className="mt-14 font-display text-3xl font-semibold">
                  Invitations
                </h2>
                <div className="mt-5 divide-y divide-border border-y border-border">
                  {invitations.length === 0 ? (
                    <p className="py-5 text-muted-foreground">
                      No invitations yet.
                    </p>
                  ) : (
                    invitations.map((invitationRecord) => (
                      <div
                        key={invitationRecord.id}
                        className="flex flex-wrap items-center justify-between gap-4 py-5"
                      >
                        <div>
                          <p className="font-medium">{invitationRecord.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {invitationRecord.email}
                          </p>
                        </div>
                        <select
                          value={invitationRecord.status}
                          onChange={(e) =>
                            updateInvitationStatus(
                              invitationRecord.id,
                              e.target.value,
                            )
                          }
                          className="h-10 border border-border bg-background px-3"
                        >
                          {invitationStatuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                        {String(invitationRecord.status).toLowerCase() ===
                          "pending" && (
                          <button
                            type="button"
                            onClick={() => resendInvitation(invitationRecord.id)}
                            disabled={resendingInvitationId === invitationRecord.id}
                            className="inline-flex min-h-10 items-center justify-center border border-primary px-3 text-xs uppercase tracking-widest text-primary disabled:opacity-50"
                          >
                            {resendingInvitationId === invitationRecord.id
                              ? "Resending…"
                              : "Resend email"}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <h2 className="mt-14 font-display text-3xl font-semibold">
                  Registrations
                </h2>
                <div className="mt-5 divide-y divide-border border-y border-border">
                  {registrations.length === 0 ? (
                    <p className="py-5 text-muted-foreground">
                      No registrations yet.
                    </p>
                  ) : (
                    registrations.map((registration) => (
                      <div
                        key={registration.id}
                        className="flex flex-wrap items-center justify-between gap-4 py-5"
                      >
                        <div>
                          <p className="font-medium">{registration.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {registration.email}
                          </p>
                          {event.fee > 0 && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`text-xs font-medium ${(registration.paymentStatus || registration.registrationPaymentStatus) === "Paid" ? "text-green-700" : "text-red-700"}`}
                              >
                                {(registration.paymentStatus ||
                                  registration.registrationPaymentStatus) ===
                                "Paid"
                                  ? "Paid"
                                  : "Payment required"}
                              </span>
                              {(registration.paymentStatus ||
                                registration.registrationPaymentStatus) !==
                                "Paid" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    markRegistrationPaid(registration.id)
                                  }
                                  className="inline-flex min-h-9 items-center justify-center border border-primary px-3 text-xs text-primary"
                                >
                                  Mark as Paid
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              updateStatus(registration.id, "Confirmed")
                            }
                            disabled={registration.status === "Confirmed"}
                            className="min-h-10 bg-primary px-3 text-xs uppercase tracking-widest text-primary-foreground disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() =>
                              updateStatus(registration.id, "Declined")
                            }
                            disabled={registration.status === "Declined"}
                            className="min-h-10 border border-destructive px-3 text-xs uppercase tracking-widest text-destructive disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </>
        )}
      </section>
      {showInvitationConfirmation && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-5"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-background p-8 shadow-xl">
            <h2 className="font-display text-3xl font-semibold">
              {invitationSent ? "Invitation sent" : "Confirm invitation"}
            </h2>
            <p className="mt-4 text-muted-foreground">{invitationMessage}</p>
            <button
              onClick={
                invitationSent
                  ? () => setShowInvitationConfirmation(false)
                  : confirmInvitation
              }
              className="mt-7 min-h-12 bg-primary px-7 text-sm uppercase tracking-widest text-primary-foreground"
            >
              {invitationSent ? "Done" : "Send invitation"}
            </button>
          </div>
        </div>
      )}
      {showConfirmation && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-5"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-background p-8 shadow-xl">
            <h2 className="font-display text-3xl font-semibold">
              {pendingWithdrawal
                ? "Confirm withdrawal"
                : pendingRegistration
                  ? "Confirm registration"
                  : confirmationMessage.includes("withdrawn")
                    ? "Participation withdrawn"
                    : confirmationMessage.includes("review your application")
                      ? "Registration request sent"
                      : "You are registered"}
            </h2>
            <p className="mt-4 text-muted-foreground">{confirmationMessage}</p>
            <button
              onClick={
                pendingWithdrawal
                  ? confirmWithdrawal
                  : pendingRegistration
                    ? confirmRegistration
                    : () => setShowConfirmation(false)
              }
              className="mt-7 min-h-12 bg-primary px-7 text-sm uppercase tracking-widest text-primary-foreground"
            >
              {pendingWithdrawal
                ? "Confirm withdrawal"
                : pendingRegistration
                  ? "Confirm registration"
                  : "Got it"}
            </button>
          </div>
        </div>
      )}
    </SiteChrome>
  );
}
