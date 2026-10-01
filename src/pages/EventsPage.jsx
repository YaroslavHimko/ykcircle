import { useProductConfiguration } from '@/lib/product-configuration';
import LogoUpload from "@/components/LogoUpload";
import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import SiteChrome from "@/components/SiteChrome";
import DirectoryActions from '@/components/DirectoryActions';
import EventPreviewCard from '@/components/EventPreviewCard';
import MyEventsSection, { useAttendingEvents } from '@/components/MyEventsSection';
import { RepresentativeEvents } from "@/components/EventRepresentatives";
import { apiFetch } from "@/lib/api";
import { eventImageRenderDebug, eventMediaUrl } from "@/lib/media";
import GoogleLocationPicker from "@/components/GoogleLocationPicker";
import { deviceTimezone, localDateTimeForZone, localDateTimeToUtc } from "@/lib/time";

const isBookableVenue = (venue) => venue?.moderationStatus === "approved" && (venue.isActive === true || venue.isActive === 1 || venue.isActive === "1" || venue.isActive === "true");

const initialForm = {
  title: "",
  shortDescription: "",
  description: "",
  foodOptions: [],
  coverImage: "",
  brandName: "",
  logoImage: "",
  categoryId: "",
  typeId: "",
  country: "",
  city: "Stockholm",
  locationType: "custom",
  venueId: "",
  location: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  locality: "Stockholm",
  municipality: "",
  region: "",
  countryCode: "SE",
  latitude: "",
  longitude: "",
  googlePlaceId: "",
  formattedAddress: "",
  onlineUrl: "",
  onlinePlatform: "",
  startsAt: "",
  endsAt: "",
  recurrenceFrequency: "none",
  recurrenceInterval: "1",
  recurrenceCount: "2",
  timezone: deviceTimezone(),
  pricingType: "free",
  fee: "0",
  currency: "SEK",
  registrationType: "yaroko",
  visibility: "Public",
};

function LegacyBookingDayTimeline({ available, unavailable = [], selectedInterval, selectedStart, selectedEnd, onSelect, asMinutes, asTime }) {
  const hours = Array.from({ length: 15 }, (_, index) => index + 7);
  const hourHeight = 64;
  const height = hours.length * hourHeight;
  const selectedTop = ((selectedStart / 60) - 7) * hourHeight;
  const selectedHeight = ((selectedEnd - selectedStart) / 60) * hourHeight;
  return <div className="mt-5 overflow-auto border border-border bg-background" style={{ maxHeight: "34rem" }}><div className="min-w-[20rem]"><div className="grid grid-cols-[4.5rem_1fr] border-b border-border bg-secondary/30"><div className="border-r border-border" /><div className="px-3 py-3 text-sm font-medium">Bookable venue time <span className="ml-2 text-xs font-normal text-muted-foreground">30-minute slots</span></div></div><div className="grid grid-cols-[4.5rem_1fr]"><div className="relative border-r border-border" style={{ height }}>{hours.map((hour) => <span key={hour} className="absolute right-2 -translate-y-2 text-xs text-muted-foreground" style={{ top: (hour - 7) * hourHeight }}>{asTime(hour * 60)}</span>)}</div><div className="relative" style={{ height }}>{hours.map((hour) => <span key={hour} className="pointer-events-none absolute left-0 right-0 border-b border-border/80" style={{ top: (hour - 7) * hourHeight }} />)}{hours.slice(0, -1).map((hour) => <span key={`half-${hour}`} className="pointer-events-none absolute left-0 right-0 border-b border-dashed border-border/50" style={{ top: (hour - 6.5) * hourHeight }} />)}{unavailable.map((slot, index) => { const start = asMinutes(slot.startTime || slot.start); const end = asMinutes(slot.endTime || slot.end); const top = Math.max(0, ((start / 60) - 7) * hourHeight); const bottom = Math.min(height, ((end / 60) - 7) * hourHeight); if (bottom <= top) return null; return <div key={`unavailable-${slot.startTime || slot.start}-${index}`} className="pointer-events-none absolute left-2 right-2 z-10 border border-slate-500/50 bg-slate-500/20 p-3 text-left text-sm text-muted-foreground" style={{ top: top + 3, height: Math.max(34, bottom - top - 6) }}><strong className="block">Unavailable</strong><span className="mt-1 block text-xs">{asTime(start)}–{asTime(end)}</span></div>; })}{available.map((slot, index) => { const start = asMinutes(slot.startTime || slot.start); const end = asMinutes(slot.endTime || slot.end); const top = Math.max(0, ((start / 60) - 7) * hourHeight); const bottom = Math.min(height, ((end / 60) - 7) * hourHeight); if (bottom <= top) return null; return <button key={`${slot.startTime || slot.start}-${index}`} type="button" aria-pressed={selectedInterval === slot} onClick={(event) => { const minutesFromTop = ((event.clientY - event.currentTarget.getBoundingClientRect().top) / event.currentTarget.getBoundingClientRect().height) * (end - start); const clickedStart = start + Math.max(0, Math.min(end - start - 30, Math.floor(minutesFromTop / 30) * 30)); onSelect(slot, clickedStart); }} className="absolute left-2 right-2 z-10 border border-accent/50 bg-accent/10 p-3 text-left text-sm shadow-sm hover:bg-accent/20" style={{ top: top + 3, height: Math.max(34, bottom - top - 6) }}><strong className="block">{asTime(start)}–{asTime(end)}</strong><span className="mt-1 block text-xs opacity-80">Click a 30-minute position to start there</span></button>; })}{selectedInterval && selectedEnd > selectedStart && selectedTop >= 0 && selectedTop < height && <div className="pointer-events-none absolute left-3 right-3 z-20 border-2 border-primary bg-primary/25 p-2 text-xs font-semibold text-primary shadow-sm" style={{ top: selectedTop + 3, height: Math.max(28, Math.min(height - selectedTop - 3, selectedHeight - 6)) }}>Selected: {asTime(selectedStart)}–{asTime(selectedEnd)}</div>}</div></div></div></div>;
}

function BookingDayTimeline({ available, unavailable = [], selectedInterval, selectedStart, selectedEnd, onSelect, asMinutes, asTime }) {
  const hours = Array.from({ length: 15 }, (_, index) => index + 7);
  const hourHeight = 64;
  const height = hours.length * hourHeight;
  const range = (start, end) => ({
    top: Math.max(0, ((start / 60) - 7) * hourHeight),
    bottom: Math.min(height, ((end / 60) - 7) * hourHeight),
  });
  const selected = range(selectedStart, selectedEnd);
  const selectedHeight = Math.max(0, selected.bottom - selected.top - 6);

  return <div className="mt-5 overflow-auto border border-border bg-background" style={{ maxHeight: "34rem" }}>
    <div className="min-w-[20rem]">
      <div className="grid grid-cols-[4.5rem_1fr] border-b border-border bg-secondary/30"><div className="border-r border-border" /><div className="px-3 py-3 text-sm font-medium">Bookable venue time <span className="ml-2 text-xs font-normal text-muted-foreground">30-minute slots</span></div></div>
      <div className="grid grid-cols-[4.5rem_1fr]">
        <div className="relative border-r border-border" style={{ height }}>{hours.map((hour) => <span key={hour} className="absolute right-2 -translate-y-2 text-xs text-muted-foreground" style={{ top: (hour - 7) * hourHeight }}>{asTime(hour * 60)}</span>)}</div>
        <div className="relative" style={{ height }}>
          {hours.map((hour) => <span key={hour} className="pointer-events-none absolute left-0 right-0 border-b border-border/80" style={{ top: (hour - 7) * hourHeight }} />)}
          {hours.slice(0, -1).map((hour) => <span key={`half-${hour}`} className="pointer-events-none absolute left-0 right-0 border-b border-dashed border-border/50" style={{ top: (hour - 6.5) * hourHeight }} />)}
          {unavailable.map((slot, index) => {
            const start = asMinutes(slot.startTime || slot.start); const end = asMinutes(slot.endTime || slot.end); const position = range(start, end); const blockHeight = Math.max(0, position.bottom - position.top - 6);
            if (!blockHeight) return null;
            const compact = blockHeight < 50;
            return <div key={`unavailable-${slot.startTime || slot.start}-${index}`} title={`Unavailable: ${asTime(start)}-${asTime(end)}`} className={`pointer-events-none absolute left-2 right-2 z-20 overflow-hidden border border-slate-500 bg-slate-500 text-left text-white ${compact ? "flex items-center px-2 text-xs" : "p-3 text-sm"}`} style={{ top: position.top + 3, height: blockHeight }}>{compact ? <span className="truncate">Unavailable</span> : <><strong className="block">Unavailable</strong><span className="mt-1 block text-xs">{asTime(start)}-{asTime(end)}</span></>}</div>;
          })}
          {available.map((slot, index) => {
            const start = asMinutes(slot.startTime || slot.start); const end = asMinutes(slot.endTime || slot.end); const position = range(start, end); const blockHeight = Math.max(0, position.bottom - position.top - 6);
            if (!blockHeight) return null;
            const compact = blockHeight < 50;
            return <button key={`${slot.startTime || slot.start}-${index}`} type="button" aria-pressed={selectedInterval === slot} onClick={(event) => { const minutesFromTop = ((event.clientY - event.currentTarget.getBoundingClientRect().top) / event.currentTarget.getBoundingClientRect().height) * (end - start); const clickedStart = start + Math.max(0, Math.min(end - start - 30, Math.floor(minutesFromTop / 30) * 30)); onSelect(slot, clickedStart); }} className={`absolute left-2 right-2 z-10 overflow-hidden border border-accent/50 bg-accent/10 text-left shadow-sm hover:bg-accent/20 ${compact ? "px-2 text-xs" : "p-3 text-sm"}`} style={{ top: position.top + 3, height: blockHeight }}>{compact ? <span className="block truncate">{asTime(start)}-{asTime(end)}</span> : <><strong className="block">{asTime(start)}-{asTime(end)}</strong><span className="mt-1 block text-xs opacity-80">Click a 30-minute position to start there</span></>}</button>;
          })}
          {selectedInterval && selectedEnd > selectedStart && selected.top >= 0 && selected.top < height && selectedHeight > 0 && <div className={`pointer-events-none absolute left-3 right-3 z-30 overflow-hidden border-2 border-primary bg-primary font-semibold text-primary-foreground shadow-sm ${selectedHeight < 50 ? "flex items-center px-2 text-xs" : "p-2 text-xs"}`} style={{ top: selected.top + 3, height: selectedHeight }}>{selectedHeight < 50 ? <span className="truncate">Selected: {asTime(selectedStart)}-{asTime(selectedEnd)}</span> : <>Selected: {asTime(selectedStart)}-{asTime(selectedEnd)}</>}</div>}
        </div>
      </div>
    </div>
  </div>;
}

function VenueBookingPicker({ venues, venueId, onVenueChange, selectedDate, onDateChange, schedule, selectedSlot, onSelectSlot, onConfirmSlot, selectedEventTime }) {
  const asMinutes = (value) => {
    if (typeof value === "number") return value;
    const [hours = 0, minutes = 0] = String(value || "00:00").slice(0, 5).split(":").map(Number);
    return hours * 60 + minutes;
  };
  const asTime = (value) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
  const positive = (...values) => values.map(Number).find((value) => Number.isFinite(value) && value > 0);
  const increment = positive(schedule.slotIncrementMinutes, schedule.slotIncrement) || 30;
  const minimumDuration = positive(schedule.minimumDurationMinutes, schedule.minDurationMinutes, schedule.minimumDuration, schedule.minimumBookingMinutes, Number(schedule.minimumBookingHours) * 60) || increment;
  const maximumDuration = positive(schedule.maximumDurationMinutes, schedule.maxDurationMinutes, schedule.maximumDuration, schedule.maximumBookingMinutes, Number(schedule.maximumBookingHours) * 60) || Infinity;
  const eventTimeOnSelectedDate = selectedEventTime?.date === selectedDate
    ? selectedEventTime
    : null;
  // While editing, the event's persisted range is not an available interval:
  // it is correctly returned as occupied by the API. Use it as the initial
  // visual selection so the manager can still see the event on the grid.
  const persistedInterval = eventTimeOnSelectedDate
    ? { startTime: eventTimeOnSelectedDate.start, endTime: eventTimeOnSelectedDate.end }
    : null;
  const selectedInterval = selectedSlot?.interval || (selectedSlot && persistedInterval ? persistedInterval : selectedSlot) || persistedInterval;
  const intervalStart = asMinutes(selectedInterval?.startTime || selectedInterval?.start);
  const intervalEnd = asMinutes(selectedInterval?.endTime || selectedInterval?.end);
  const selectedStart = asMinutes(selectedSlot?.selectedStart ?? selectedInterval?.startTime ?? selectedInterval?.start);
  const selectedEnd = asMinutes(selectedSlot?.selectedEnd ?? selectedInterval?.endTime ?? selectedInterval?.end);
  const timeApplied = Boolean(eventTimeOnSelectedDate && eventTimeOnSelectedDate.start === asTime(selectedStart) && eventTimeOnSelectedDate.end === asTime(selectedEnd));
  const startOptions = selectedInterval ? Array.from({ length: Math.max(0, Math.floor((intervalEnd - intervalStart - minimumDuration) / increment) + 1) }, (_, index) => intervalStart + index * increment) : [];
  const endOptions = selectedInterval ? Array.from({ length: Math.max(0, Math.floor((Math.min(intervalEnd, selectedStart + maximumDuration) - selectedStart - minimumDuration) / increment) + 1) }, (_, index) => selectedStart + minimumDuration + index * increment) : [];
  const selectInterval = (interval, requestedStart) => {
    if (schedule.bookingMode === "daily") {
      onSelectSlot({ interval, selectedStart: 0, selectedEnd: 1439 });
      return;
    }
    const intervalStart = asMinutes(interval.startTime || interval.start);
    const end = asMinutes(interval.endTime || interval.end);
    const start = Math.max(intervalStart, Math.min(Number(requestedStart) || intervalStart, end - minimumDuration));
    onSelectSlot({ interval, selectedStart: start, selectedEnd: start + minimumDuration });
  };
  const updateStart = (value) => {
    const nextStart = Number(value);
    const validEnd = selectedEnd > nextStart && selectedEnd - nextStart >= minimumDuration && selectedEnd - nextStart <= maximumDuration && selectedEnd <= intervalEnd && (selectedEnd - nextStart - minimumDuration) % increment === 0;
    onSelectSlot({ ...(selectedSlot || { interval: selectedInterval }), selectedStart: nextStart, selectedEnd: validEnd ? selectedEnd : nextStart + minimumDuration });
  };
  const available = schedule.slots || [];
  if (schedule.bookingMode === "daily") return <div className="sm:col-span-2 border border-border bg-secondary/10 p-4 sm:p-5"><div><p className="text-xs uppercase tracking-[0.2em] text-primary">Venue scheduling</p><h3 className="mt-1 font-display text-2xl font-semibold">Book a full day</h3><p className="mt-1 text-sm text-muted-foreground">This venue is charged per day / evening. Selecting an available date reserves the entire local day.</p></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Venue<select required value={venueId} onChange={(event) => onVenueChange(event.target.value)} className="mt-2 min-h-11 w-full border border-border bg-background px-3"><option value="">Choose a venue</option>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}{venue.location?.locality || venue.city ? ` — ${venue.location?.locality || venue.city}` : ""}</option>)}</select></label><label className="text-sm font-medium">Date<input type="date" required value={selectedDate} onChange={(event) => onDateChange(event.target.value)} className="mt-2 min-h-11 w-full border border-border bg-background px-3" /></label></div>{!venueId ? <p className="mt-5 text-sm text-muted-foreground">Choose a venue to see available dates.</p> : !selectedDate ? <p className="mt-5 text-sm text-muted-foreground">Choose a date to check availability.</p> : schedule.loading ? <p role="status" className="mt-5 text-sm text-muted-foreground">Loading availability…</p> : schedule.error ? <p role="alert" className="mt-5 text-sm text-destructive">{schedule.error}</p> : available.length ? <div className="mt-5 border border-primary/40 bg-background p-4"><p className="text-sm font-medium">{selectedSlot?.daily ? "Full day selected" : "This date is available"}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => onSelectSlot({ daily: true, selectedStart: 0, selectedEnd: 1439 })} className="border border-border px-4 py-2 text-sm">Select full day</button><button type="button" disabled={!selectedSlot?.daily} onClick={onConfirmSlot} className="bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">Apply this day</button></div></div> : <p className="mt-5 text-sm text-muted-foreground">This venue is not available on this date.</p>}</div>;
  return <div className="sm:col-span-2 border border-border bg-secondary/10 p-4 sm:p-5">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-primary">Venue scheduling</p><h3 className="mt-1 font-display text-2xl font-semibold">Choose a booking time</h3><p className="mt-1 text-sm text-muted-foreground">The venue’s current availability and duration rules determine which times can be selected.</p></div>{schedule.timezone && <p className="text-sm text-muted-foreground">Venue time: {schedule.timezone}</p>}</div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Venue<select required value={venueId} onChange={(event) => onVenueChange(event.target.value)} className="mt-2 min-h-11 w-full border border-border bg-background px-3"><option value="">Choose a venue</option>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}{venue.location?.locality || venue.city ? ` — ${venue.location?.locality || venue.city}` : ""}</option>)}</select></label><label className="text-sm font-medium">Date<input type="date" required value={selectedDate} onChange={(event) => onDateChange(event.target.value)} className="mt-2 min-h-11 w-full border border-border bg-background px-3" /></label></div>
    {eventTimeOnSelectedDate?.start && eventTimeOnSelectedDate?.end && <p className="mt-4 border border-primary/40 bg-primary/5 p-3 text-sm">Event time: <strong>{eventTimeOnSelectedDate.start}–{eventTimeOnSelectedDate.end}</strong><span className="ml-2 text-primary">Current booking</span></p>}
    {schedule.nextAvailable?.date && <button type="button" onClick={() => onDateChange(schedule.nextAvailable.date)} className="mt-4 border border-accent/50 bg-accent/10 px-4 py-3 text-left text-sm hover:bg-accent/20"><strong>Next available: {schedule.nextAvailable.date}</strong><span className="ml-2">{schedule.nextAvailable.startTime}–{schedule.nextAvailable.endTime}</span><span className="mt-1 block text-xs">Choose this date</span></button>}
    {!venueId ? <p className="mt-5 text-sm text-muted-foreground">Choose a venue to see its free times.</p> : !selectedDate ? <p className="mt-5 text-sm text-muted-foreground">Choose a date to see available times.</p> : schedule.loading ? <p role="status" className="mt-5 text-sm text-muted-foreground">Loading availability…</p> : schedule.error ? <p role="alert" className="mt-5 text-sm text-destructive">{schedule.error}</p> : <>{(available.length || schedule.unavailableSlots?.length || schedule.unavailableIntervals?.length) ? <BookingDayTimeline available={available} unavailable={schedule.unavailableSlots || schedule.unavailableIntervals || []} selectedInterval={selectedInterval} selectedStart={selectedStart} selectedEnd={selectedEnd} onSelect={selectInterval} asMinutes={asMinutes} asTime={asTime} /> : <p className="mt-5 text-sm text-muted-foreground">No scheduled hours are available on this date.</p>}{selectedInterval && <div className="mt-5 border border-primary/40 bg-background p-4"><p className="text-sm font-medium">Choose the booking time</p><p className="mt-1 text-xs text-muted-foreground">Start and end are limited to the selected free interval and this venue’s booking rules.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Start<select value={selectedStart} onChange={(event) => updateStart(event.target.value)} className="mt-2 min-h-11 w-full border border-border bg-background px-3">{startOptions.map((value) => <option key={value} value={value}>{asTime(value)}</option>)}</select></label><label className="text-sm font-medium">End<select value={selectedEnd} onChange={(event) => onSelectSlot({ ...selectedSlot, selectedEnd: Number(event.target.value) })} className="mt-2 min-h-11 w-full border border-border bg-background px-3">{endOptions.map((value) => <option key={value} value={value}>{asTime(value)}</option>)}</select></label></div><div className="mt-4 flex flex-wrap items-center justify-between gap-4"><p className="text-sm">Selected: <strong>{asTime(selectedStart)}–{asTime(selectedEnd)}</strong></p><div className="flex gap-2"><button type="button" onClick={onConfirmSlot} className="bg-primary px-4 py-2 text-sm text-primary-foreground">{timeApplied ? "Time applied" : "Apply this time"}</button><button type="button" onClick={() => onSelectSlot(null)} className="border border-border px-4 py-2 text-sm">Clear</button></div></div>{timeApplied && <p role="status" className="mt-3 text-sm text-primary">Time applied to the event. Save the event to keep this selection.</p>}</div>}</>}
  </div>;
}

const testEventPresets = [
  ["Sunrise walk at Djurgården","Start the day with a relaxed waterside walk and coffee.","Join a friendly sunrise walk through Djurgården. We will keep an easy pace, stop for photos and finish with coffee together.","Rosendal Garden","Rosendalsvägen 38, 115 21 Stockholm","2030-06-08T08:00","2030-06-08T10:00","free","0","physical","public","none"],
  ["Beginner bouldering social","Learn the basics and meet other climbers.","A welcoming indoor bouldering session for complete beginners. An instructor will cover safety and basic techniques before open social climbing.","Klättercentret Telefonplan","Tellusgången 22, 126 26 Hägersten","2030-06-12T18:30","2030-06-12T21:00","paid","180","physical","public","none"],
  ["Midsummer picnic planning","Make new plans over snacks in the park.","Bring a small picnic item to share and help build a friendly Midsummer plan with new people in Stockholm.","Tantolunden","Tantolunden, 118 42 Stockholm","2030-06-15T14:00","2030-06-15T17:00","free","0","physical","public","weekly"],
  ["Stockholm street-photo walk","Find better frames with a small creative group.","Explore Södermalm with a camera or phone, swap composition tips and select a few favourite photos together afterwards.","Mariatorget","Mariatorget, 118 48 Stockholm","2030-06-18T17:30","2030-06-18T20:00","free","0","physical","public","none"],
  ["Sunday board-game brunch","Easy games, pastries and new people.","A low-pressure Sunday brunch with modern board games. New players are especially welcome and rules will be explained.","Alphaspel","Östgötagatan 33, 116 25 Stockholm","2030-06-23T11:00","2030-06-23T14:00","paid","90","physical","public","none"],
  ["Swedish fika conversation club","Practice Swedish in a relaxed small group.","Build confidence speaking Swedish through guided conversation prompts, café chat and a little help from fellow learners.","Kulturhuset Stadsteatern","Sergels torg, 111 57 Stockholm","2030-06-25T18:00","2030-06-25T19:30","free","0","physical","public","weekly"],
  ["Kayak taster on Lake Mälaren","Try kayaking with a supportive crew.","A beginner-friendly kayak taster with equipment, safety briefing and a calm route close to shore.","Långholmens Kajak","Långholmsmuren 21, 117 33 Stockholm","2030-06-29T10:00","2030-06-29T12:30","paid","350","physical","public","none"],
  ["Remote co-working sprint","Focus together from wherever you are.","Join a structured online co-working session with short introductions, two focus blocks and a friendly check-out.","Online via video call","A joining link will be sent after registration.","2030-07-02T09:00","2030-07-02T11:30","free","0","online","private","weekly"],
  ["Evening run by the water","A social 5 km at a conversational pace.","Run a relaxed route around Kungsholmen, with a no-drop pace and an optional cool-down drink afterwards.","Rålambshovsparken","Smedsuddsvägen, 112 35 Stockholm","2030-07-05T18:30","2030-07-05T19:45","free","0","physical","public","none"],
  ["Ceramics introduction workshop","Make a small piece from clay and unwind.","Learn simple hand-building techniques in a calm studio session. Your finished piece will be glazed and fired by the studio.","Stockholm Ceramic Studio","Sankt Eriksgatan 39, 112 34 Stockholm","2030-07-09T18:00","2030-07-09T20:30","paid","420","physical","public","none"],
];
const toInputDate = (value, timezone = deviceTimezone()) => localDateTimeForZone(value, timezone);
const todayAtPresetTime = (value) => {
  const today = new Date();
  const pad = (number) => String(number).padStart(2, "0");
  const time = String(value || "09:00").slice(11, 16) || "09:00";
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T${time}`;
};
const eventDateTimeLabel = (event) => {
  if (!event?.startsAt) return "Date to be announced";
  const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
  const start = formatter.format(new Date(event.startsAt));
  return event.endsAt ? `${start} – ${formatter.format(new Date(event.endsAt))}` : start;
};
const eventCover = eventMediaUrl;
const EventCoverImage = ({ event, className, alt = "", component }) => {
  const src = eventCover(event);
  if (!src) return null;
  eventImageRenderDebug({ component, event });
  return <img src={src} alt={alt} className={className} />;
};
const eventValue = (event, ...keys) =>
  keys.map((key) => event?.[key]).find((value) => value !== undefined && value !== null) ?? "";
export default function EventsPage({
  managementOnly = false,
  creationPage = false,
  editPage = false,
}) {
  const { id: editId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedGroupId = new URLSearchParams(location.search).get("groupId");
  const selectedCategory = searchParams.get("category") || "";
  const draftMessageRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("authUser") || "null");
  const token = localStorage.getItem("authToken");
  const canManage = Boolean(managementOnly && token);
  const attending = useAttendingEvents(!managementOnly ? token : null);
  const canManageAllEvents = Boolean(
    user && ["manager", "admin"].includes(user.role),
  );
  const isAdministrator = user?.role === "admin";
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState([]);
  const [archivedEvents, setArchivedEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [managedGroups, setManagedGroups] = useState([]);
  const [venues, setVenues] = useState([]);
  const [venueSchedule, setVenueSchedule] = useState({ loading: false, error: "", date: "", timezone: "", slots: [] });
  const [pendingVenueSlot, setPendingVenueSlot] = useState(null);
  const productConfiguration = useProductConfiguration();
  const [organizers, setOrganizers] = useState([]);
  useEffect(() => { if (!token || !managementOnly) return; let alive = true; apiFetch('/api/subscriptions/options').then(response => response.ok ? response.json() : null).then(data => { if (alive && data) setOrganizers(data.owners.filter(owner => owner.type === 'organization')); }).catch(() => {}); return () => { alive = false; }; }, [token, managementOnly]);
  const [form, setForm] = useState(initialForm);
  const [draftId, setDraftId] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [pendingCover, setPendingCover] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [publishedEvent, setPublishedEvent] = useState(null);
  const [savedEvent, setSavedEvent] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (!error && !message) return undefined;
    const timer = window.setTimeout(() => {
      setError("");
      setMessage("");
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [error, message]);
  useEffect(() => {
    if (draftSaved)
      window.setTimeout(() => draftMessageRef.current?.focus(), 0);
  }, [draftSaved]);
  useEffect(() => {
    if (!creationPage) return;
    setForm({ ...initialForm, brandName: user?.name || "", groupId: requestedGroupId || "" });
    setDraftId(null);
    setDraftSaved(false);
    setPendingCover(null);
    setErrors({});
    setError("");
  }, [creationPage, requestedGroupId]);
  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const eventEndpoint = managementOnly ? '/api/my/events' : '/api/events';
      const eventPath = selectedCategory
          ? `${eventEndpoint}?category=${encodeURIComponent(selectedCategory)}`
          : eventEndpoint;
      const response = await apiFetch(
        eventPath,
        managementOnly && token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {},
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load events.");
      const loadedEvents = Array.isArray(data) ? data : data.events || [];
      if (managementOnly) {
        setMine(loadedEvents);
        setEvents([]);
      } else {
        setEvents(loadedEvents);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };
  useEffect(() => {
    load()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [canManage, token, location.pathname, managementOnly, selectedCategory]);
  useEffect(() => {
    Promise.all(
      ["/api/event-categories", "/api/event-types"].map((path) => apiFetch(path)),
    )
      .then(async (responses) => {
        const values = await Promise.all(
          responses.map((response) => response.json()),
        );
        if (responses[0].ok) setCategories(values[0]);
        if (responses[1].ok) setTypes(values[1]);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!canManage || !token) return;
    apiFetch("/api/my/groups/managed", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        setManagedGroups(Array.isArray(data) ? data : data.groups || []);
      })
      .catch(() => {});
  }, [canManage, token]);
  useEffect(() => {
    if (!canManage) return;
    apiFetch("/api/venues", token ? { headers: { Authorization: `Bearer ${token}` } } : {})
      .then(async (response) => response.ok ? response.json() : [])
      .then((data) => setVenues((Array.isArray(data) ? data : data.venues || []).filter(isBookableVenue)))
      .catch(() => setVenues([]));
  }, [canManage, token]);
  const selectedVenueDate = form.startsAt?.slice(0, 10) || "";
  useEffect(() => {
    let cancelled = false;
    setPendingVenueSlot(null);
    if (!canManage || !token || form.locationType !== "venue" || !form.venueId || !/^\d{4}-\d{2}-\d{2}$/.test(selectedVenueDate)) {
      setVenueSchedule({ loading: false, error: "", date: "", timezone: "", slots: [], nextAvailable: null });
      return undefined;
    }
    setVenueSchedule({ loading: true, error: "", date: selectedVenueDate, timezone: "", slots: [], nextAvailable: null });
    apiFetch(`/api/venues/${form.venueId}/availability?date=${encodeURIComponent(selectedVenueDate)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load venue availability.");
        if (!cancelled) setVenueSchedule({ ...data, loading: false, error: "", date: data.date || selectedVenueDate, timezone: data.timezone || "", slots: data.slots || [], nextAvailable: data.nextAvailable || null });
      })
      .catch((requestError) => !cancelled && setVenueSchedule({ loading: false, error: requestError.message, date: selectedVenueDate, timezone: "", slots: [], nextAvailable: null }));
    return () => { cancelled = true; };
  }, [canManage, token, form.locationType, form.venueId, selectedVenueDate]);
  const update = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  const applyTestPreset = (event) => {
    const presetIndex = Number(event.target.value);
    if (!Number.isInteger(presetIndex) || !testEventPresets[presetIndex]) return;
    const [
      title, shortDescription, description, location, address, startsAt, endsAt,
      pricingType, fee,
      rawLocationType, locationVisibility,
      recurrenceFrequency,
    ] = testEventPresets[presetIndex];
    setForm((current) => ({
      ...current,
      title, shortDescription, description, location, address, addressLine1: address, formattedAddress: address, latitude: "59.3293", longitude: "18.0686", startsAt: todayAtPresetTime(startsAt), endsAt: todayAtPresetTime(endsAt),
      locationType: rawLocationType === "physical" ? "custom" : rawLocationType, locationVisibility, pricingType, fee,
      recurrenceFrequency,
      recurrenceInterval: "1",
      recurrenceCount: recurrenceFrequency === "none" ? "2" : "4",
      country: "Sweden",
      city: "Stockholm",
      timezone: current.timezone || deviceTimezone(),
      currency: "SEK",
      registrationType: "yaroko",
      visibility: "Public",
      categoryId: categories.length ? String(categories[presetIndex % categories.length].id) : "",
      typeId: types.length ? String(types[presetIndex % types.length].id) : "",
    }));
    setErrors({});
    setMessage("Test event details loaded. Add a cover image if needed, then save the draft.");
  };
  const apply = (event) => {
    setDraftId(event.id);
    setForm((current) => ({
      ...current,
      ...event,
      title: eventValue(event, "title", "name"),
      shortDescription: eventValue(event, "shortDescription", "short_description"),
      description: eventValue(event, "description", "longDescription", "long_description"),
      foodOptions: Array.isArray(event.foodOptions) ? event.foodOptions : [],
      coverImage: eventCover(event),
      brandName: event.brandName || "",
      logoImage: event.logoImage || "",
      startsAt: toInputDate(eventValue(event, "startsAt", "startsAtUtc", "starts_at", "starts_at_utc"), eventValue(event, "timezone", "timeZone") || current.timezone),
      endsAt: toInputDate(eventValue(event, "endsAt", "endsAtUtc", "ends_at", "ends_at_utc"), eventValue(event, "timezone", "timeZone") || current.timezone),
      recurrenceFrequency: eventValue(event, "recurrenceFrequency") || "none",
      recurrenceInterval: String(eventValue(event, "recurrenceInterval") || 1),
      recurrenceCount: String(eventValue(event, "recurrenceCount") || 2),
      categoryId: eventValue(event, "categoryId", "category_id") || event.category?.id || "",
      typeId: eventValue(event, "typeId", "type_id") || event.type?.id || "",
      country: eventValue(event, "country") || event.location?.country || current.country,
      city: eventValue(event, "city") || event.location?.locality || current.city,
      location: typeof event.location === "string" ? event.location : "",
      venueId: eventValue(event, "venueId", "venue_id") || event.venue?.id || "",
      addressLine1: event.location?.addressLine1 || event.location?.address_line_1 || eventValue(event, "address") || "",
      addressLine2: event.location?.addressLine2 || event.location?.address_line_2 || "",
      postalCode: event.location?.postalCode || event.location?.postal_code || "",
      locality: event.location?.locality || event.city || "",
      municipality: event.location?.municipality || "",
      region: event.location?.region || "",
      countryCode: event.location?.countryCode || event.location?.country_code || "",
      latitude: event.location?.latitude ?? event.latitude ?? "",
      longitude: event.location?.longitude ?? event.longitude ?? "",
      googlePlaceId: event.location?.googlePlaceId || event.location?.google_place_id || "",
      formattedAddress: event.location?.formattedAddress || event.location?.formatted_address || "",
      onlineUrl: eventValue(event, "onlineUrl", "online_url"),
      onlinePlatform: eventValue(event, "onlinePlatform", "online_platform"),
      timezone: eventValue(event, "timezone", "timeZone") || current.timezone,
      groupId: eventValue(event, "groupId", "group_id"),
      organizerOrganizationId: event.organizerOrganizationId || "",
      locationType: eventValue(event, "locationType", "location_type") === "physical" ? "custom" : eventValue(event, "locationType", "location_type") || current.locationType,
      pricingType: Number(eventValue(event, "fee")) > 0 ? "paid" : "free",
      fee: eventValue(event, "fee") || 0,
    }));
  };
  const payload = () => {
    const {
      recurrenceFrequency,
      recurrenceInterval,
      recurrenceCount,
      venueId,
      location,
      address,
      addressLine1,
      addressLine2,
      postalCode,
      locality,
      municipality,
      region,
      countryCode,
      latitude,
      longitude,
      googlePlaceId,
      formattedAddress,
      onlineUrl,
      onlinePlatform,
      city,
      country,
      locationVisibility,
      ...eventForm
    } = form;
    const recurrence = !draftId && recurrenceFrequency !== "none"
      ? {
          frequency: recurrenceFrequency,
          interval: Number(recurrenceInterval),
          count: Number(recurrenceCount),
        }
      : undefined;
    return Object.fromEntries(
      Object.entries({
        ...eventForm,
        foodOptions: form.foodOptions.map((option) => option.trim()).filter(Boolean),
        venueId: form.locationType === "venue" ? Number(venueId) || undefined : undefined,
        customAddressLine1: form.locationType === "custom" ? addressLine1 : undefined,
        customAddressLine2: form.locationType === "custom" ? addressLine2 : undefined,
        customPostalCode: form.locationType === "custom" ? postalCode : undefined,
        customLocality: form.locationType === "custom" ? locality : undefined,
        customMunicipality: form.locationType === "custom" ? municipality : undefined,
        customRegion: form.locationType === "custom" ? region : undefined,
        customCountry: form.locationType === "custom" ? country : undefined,
        customCountryCode: form.locationType === "custom" ? countryCode : undefined,
        customLatitude: form.locationType === "custom" && latitude !== "" ? Number(latitude) : undefined,
        customLongitude: form.locationType === "custom" && longitude !== "" ? Number(longitude) : undefined,
        customGooglePlaceId: form.locationType === "custom" ? googlePlaceId : undefined,
        customFormattedAddress: form.locationType === "custom" ? formattedAddress : undefined,
        onlineUrl: form.locationType === "online" ? onlineUrl : undefined,
        onlinePlatform: form.locationType === "online" ? onlinePlatform : undefined,
        recurrence,
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        typeId: form.typeId ? Number(form.typeId) : undefined,
        startsAtUtc: form.startsAt
          ? localDateTimeToUtc(form.startsAt, form.timezone)
          : undefined,
        endsAtUtc: form.endsAt
          ? localDateTimeToUtc(form.endsAt, form.timezone, "end")
          : undefined,
        organizerOrganizationId: form.organizerOrganizationId ? Number(form.organizerOrganizationId) : null,
        fee: form.pricingType === "paid" ? Number(form.fee) : 0,
      }).filter(
        ([key, value]) => ["logoImage", "brandName"].includes(key) || (value !== "" && value !== null && value !== undefined),
      ),
    );
  };
  const uploadFile = async (file, eventId = draftId) => {
    if (!file || !eventId) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("coverImage", file);
      const response = await apiFetch(`/api/events/${eventId}/cover`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to upload cover image.");
      const uploadedCover = eventCover(data.event || data) || data.coverImage;
      setForm((current) => ({ ...current, coverImage: uploadedCover }));
      setPendingCover(null);
      return uploadedCover;
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  };
  const save = async (event) => {
    event?.preventDefault();
    if (logoBusy) return;
    setErrors({});
    setError("");
    setMessage("");
    try {
      if (!form.endsAt || !localDateTimeToUtc(form.endsAt, form.timezone, 'end')) {
        setErrors({ endsAt: 'Choose an end date and time.' });
        throw new Error('Choose an end date and time before saving the event.');
      }
      if (form.startsAt && localDateTimeToUtc(form.endsAt, form.timezone, 'end') <= localDateTimeToUtc(form.startsAt, form.timezone)) {
        setErrors({ endsAt: 'The end must be after the start.' });
        throw new Error('The event must end after it starts.');
      }
      if (form.locationType === "custom" && (!form.formattedAddress || !Number.isFinite(Number(form.latitude)) || !Number.isFinite(Number(form.longitude)))) {
        setErrors({ location: "Choose an address from the Google suggestions so its location can be saved." });
        throw new Error("Choose an address from the Google suggestions.");
      }
      const selectedGroupId = managedGroups.some(
        (group) => String(group.id) === String(form.groupId),
      )
        ? form.groupId
        : "";
      const draftPath = selectedGroupId
        ? `/api/groups/${selectedGroupId}/events/drafts`
        : "/api/events/drafts";
      const requestPayload = payload();
      delete requestPayload.groupId;
      const response = await apiFetch(
        draftId ? `/api/events/${draftId}` : draftPath,
        {
          method: draftId ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setErrors(data.fields || {});
        const fields = Object.entries(data.fields || {})
          .map(([field, message]) => `${field}: ${message}`)
          .join(" · ");
        throw new Error(fields || data.error || "Unable to save draft.");
      }
      apply(data);
      setDraftSaved(!editPage);
      if (editPage) setSavedEvent(true);
      setMessage("");
      if (pendingCover) await uploadFile(pendingCover, data.id);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const uploadCover = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setPendingCover(file);
      if (draftId) uploadFile(file);
      else setMessage("Cover selected. Save the draft to upload it.");
    }
    event.target.value = "";
  };
  const executePublish = async (id) => {
    const response = await apiFetch(`/api/events/${id}/publish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      setErrors(data.fields || {});
      if (data.code === "SUBSCRIPTION_REQUIRED" && data.subscribeUrl?.startsWith("/subscribe?")) { navigate(data.subscribeUrl); return; }
      setError(data.error || "Event cannot be published.");
      return;
    }
    const published = data.event || data;
    setPublishedEvent({
      id,
      title: published.title || form.title || "Your event",
    });
    await load();
  };
  const publishEvent = (id) => setDialog({ action: "publish", id });
  const executeDelete = async (id, isDraft = false) => {
    const response = await apiFetch(`/api/events/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Unable to delete event.");
      return;
    }
    if (draftId === id) {
      setDraftId(null);
      setForm(initialForm);
    }
    setEvents((current) => current.filter((event) => event.id !== id));
    setMine((current) => current.filter((event) => event.id !== id));
    setArchivedEvents((current) => current.filter((event) => event.id !== id));
    setMessage(isDraft ? "Draft deleted." : "Event deleted.");
    load(false).catch(() => {});
  };
  const deleteEvent = (id, isDraft = false) =>
    setDialog({ action: "delete", id, isDraft });
  const updateStatus = async (id, status) => {
    const response = await apiFetch(`/api/events/${id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Unable to update event.");
      return;
    }
    if (status === "Archived") {
      const archivedEvent = [...mine, ...events].find(
        (event) => String(event.id) === String(id),
      );
      if (archivedEvent) {
        setArchivedEvents((current) => [
          { ...archivedEvent, status: "Archived" },
          ...current.filter((event) => String(event.id) !== String(id)),
        ]);
      }
      setEvents((current) => current.map((event) =>
        String(event.id) === String(id) ? { ...event, status: "Archived" } : event,
      ));
      setMine((current) => current.map((event) =>
        String(event.id) === String(id) ? { ...event, status: "Archived" } : event,
      ));
    } else if (status === "Published") {
      setArchivedEvents((current) =>
        current.filter((event) => String(event.id) !== String(id)),
      );
      setEvents((current) => current.map((event) =>
        String(event.id) === String(id) ? { ...event, status } : event,
      ));
      setMine((current) => current.map((event) =>
        String(event.id) === String(id) ? { ...event, status } : event,
      ));
    }
    setMessage(
      status === "Archived"
        ? "Event archived."
        : status === "Published"
          ? "Event restored."
          : "Event updated.",
    );
    load(false).catch((requestError) => setError(requestError.message));
  };
  const archiveEvent = (id) => setDialog({ action: "archive", id });
  const restoreEvent = (id) => setDialog({ action: "restore", id });
  const confirmDialog = async () => {
    const current = dialog;
    setDialog(null);
    if (!current) return;
    if (current.action === "delete")
      await executeDelete(current.id, current.isDraft);
    else if (current.action === "archive") await updateStatus(current.id, "Archived");
    else if (current.action === "restore") await updateStatus(current.id, "Published");
    else await executePublish(current.id);
  };
  const input = (name, label, type = "text", required = false) => (
    <label className="block text-sm">
      {label}
      {required && <span className="text-primary"> *</span>}
      <input
        name={name}
        type={type}
        step={type === "datetime-local" ? 900 : undefined}
        required={required}
        value={form[name]}
        onChange={update}
        className="mt-2 min-h-11 w-full border border-border bg-background px-3"
      />
      {errors[name] && (
        <span className="mt-1 block text-xs text-destructive">
          {errors[name]}
        </span>
      )}
    </label>
  );
  const organizerView = managementOnly && canManage;
  const displayed = organizerView && canManageAllEvents
    ? [
        ...mine,
        ...events.filter((event) => !mine.some((item) => item.id === event.id)),
      ]
    : organizerView
      ? mine
      : events;
  const eventStatus = (event) => String(event?.status || "Published").toLowerCase();
  const active = displayed.filter(
    (event) => !["archived", "draft"].includes(eventStatus(event)) && (managementOnly || !attending.events.some(item => String(item.id) === String(event.id))),
  );
  const drafts = displayed.filter((event) => eventStatus(event) === "draft");
  const archived = [...archivedEvents, ...displayed.filter((event) => eventStatus(event) === "archived")]
    .filter((event, index, all) => all.findIndex((item) => String(item.id) === String(event.id)) === index);
  useEffect(() => {
    if (!organizerView) return undefined;
    const buttons = [...document.querySelectorAll("article button")].filter(
      (button) => button.textContent === "Edit",
    );
    buttons.forEach((button) => {
      const article = button.closest("article");
      const event = displayed.find((item) =>
        article?.textContent.includes(item.title),
      );
      if (!event || event.status === "Draft" || article?.dataset.actionsAdded)
        return;
      article.dataset.actionsAdded = "true";
      const actions = button.parentElement;
      const group = document.createElement("div");
      group.className = "flex flex-wrap gap-2";
      actions?.insertBefore(group, button);
      group.appendChild(button);
      button.textContent = "Manage";
      button.onclick = () => {
        window.location.assign(`/events/${event.id}?manage=1`);
      };
      const archive = document.createElement("button");
      archive.type = "button";
      archive.className = "border border-border px-3 py-2 text-sm";
      archive.textContent = "Archive";
      archive.onclick = () => archiveEvent(event.id);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className =
        "border border-destructive px-3 py-2 text-sm text-destructive";
      remove.textContent = "Delete";
      remove.onclick = () => deleteEvent(event.id);
      group.append(archive, remove);
    });
    return undefined;
  }, [organizerView, displayed]);
  useEffect(() => {
    if (!organizerView || creationPage || editPage) return undefined;
    const heading = [...document.querySelectorAll("h2")].find((item) =>
      ["Create an experience", "Edit an event"].includes(item.textContent),
    );
    const section = heading?.closest("section");
    const form = section?.querySelector("form");
    if (form) form.style.display = "none";
    if (section && !section.querySelector("[data-create-event-link]")) {
      const link = document.createElement("a");
      link.dataset.createEventLink = "true";
      link.href = "/profile/events/new";
      link.className =
        "inline-flex min-h-10 items-center bg-primary px-4 py-2 text-sm text-primary-foreground";
      link.textContent = "Create an event";
      heading?.parentElement?.parentElement?.appendChild(link);
    }
    return undefined;
  }, [organizerView, creationPage]);
  useEffect(() => {
    if (!creationPage) return undefined;
    ["Upcoming experiences", "Your events"].forEach((title) => {
      const heading = [...document.querySelectorAll("h2")].find(
        (item) => item.textContent === title,
      );
      const section = heading?.closest("section");
      if (section) section.style.display = "none";
    });
    return undefined;
  }, [creationPage]);
  useEffect(() => {
    if (!organizerView || !editPage) return undefined;
    const buttons = [...document.querySelectorAll("article button")].filter(
      (button) => button.textContent === "Edit",
    );
    buttons.forEach((button) => {
      const article = button.closest("article");
      const event = displayed.find((item) =>
        article?.textContent.includes(item.title),
      );
      if (event)
        button.onclick = () =>
          window.location.assign(`/profile/events/${event.id}/edit`);
    });
    return undefined;
  }, [organizerView, editPage, displayed]);
  useEffect(() => {
    if (!editPage || !editId) return;
    apiFetch("/api/events/" + editId, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Unable to load event.");
        apply(data);
      })
      .catch((requestError) => setError(requestError.message));
  }, [editPage, editId]);
  useEffect(() => {
    if (!editPage) return undefined;
    ["Upcoming experiences", "Your events"].forEach((title) => {
      const heading = [...document.querySelectorAll("h2")].find(
        (item) => item.textContent === title,
      );
      const section = heading?.closest("section");
      if (section) section.style.display = "none";
    });
    return undefined;
  }, [editPage]);
  useEffect(() => {
    if (!organizerView || editPage) return undefined;
    const buttons = [...document.querySelectorAll("article button")].filter(
      (button) => button.textContent === "Edit",
    );
    buttons.forEach((button) => {
      const article = button.closest("article");
      const event = displayed.find((item) =>
        article?.textContent.includes(item.title),
      );
      if (event)
        button.onclick = () =>
          window.location.assign(`/profile/events/${event.id}/edit`);
    });
    return undefined;
  }, [organizerView, editPage, displayed]);
  return (
    <SiteChrome>
      <Helmet>
        <title>Events | YKCircle</title>
      </Helmet>
      <section className="mx-auto max-w-[72rem] px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">
          YKCircle experiences
        </p>
        <h1 className="mt-3 font-display text-5xl font-black">
          Find something worth joining.
        </h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          Explore activities, gatherings and local experiences.
        </p>
        {organizerView && !creationPage && !editPage && (
          <Link
            to="/profile/events/new"
            className="mt-7 inline-flex min-h-11 items-center bg-primary px-5 text-sm text-primary-foreground"
          >
            Create an event
          </Link>
        )}
        {organizerView && !creationPage && !editPage && <RepresentativeEvents token={token} />}
        {!managementOnly && token && <DirectoryActions manageTo="/profile/events" manageLabel="Manage events" createTo="/profile/events/new" createLabel="Create an event" />}
        {!managementOnly && token && <MyEventsSection {...attending} />}
        {!managementOnly && (
          <nav aria-label="Event categories" className="mt-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className={`min-h-10 border px-4 text-sm ${!selectedCategory ? "border-primary text-primary" : "border-border"}`}
            >
              All categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSearchParams({ category: category.slug })}
                className={`min-h-10 border px-4 text-sm ${selectedCategory === category.slug ? "border-primary text-primary" : "border-border"}`}
              >
                {category.name}
              </button>
            ))}
          </nav>
        )}
        {error && (
          <p className="fixed bottom-6 left-5 z-50 max-w-md border border-destructive/30 bg-background px-4 py-3 text-sm text-destructive shadow-lg sm:left-auto sm:right-6">
            {error}
          </p>
        )}
        {canManage && (creationPage || editPage) && (
          <section className="mt-12 border-y border-border py-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-primary">
                  Event workspace
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold">
                  {editPage ? "Edit an event" : "Create an experience"}
                </h2>
              </div>
              {editPage && (
                <Link
                  to="/profile/events/new"
                  className="inline-flex min-h-11 items-center border border-border px-4 text-sm"
                >
                  Create an event
                </Link>
              )}
            </div>
            <form
              style={draftSaved ? { display: "none" } : undefined}
              onSubmit={save}
              className="mt-8 grid gap-4 sm:grid-cols-2"
            >
              {creationPage && isAdministrator && (
                <label className="border border-primary/30 bg-primary/5 p-4 text-sm sm:col-span-2">
                  Testing preset
                  <select
                    defaultValue=""
                    onChange={applyTestPreset}
                    className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                  >
                    <option value="" disabled>Choose one of 10 sample events</option>
                    {testEventPresets.map(([title], index) => (
                      <option key={title} value={index}>{index + 1}. {title}</option>
                    ))}
                  </select>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Populates all event details. Cover images must still be selected from your device.
                  </span>
                </label>
              )}
              {input("title", "Title", "text", true)}
              {creationPage && managedGroups.length > 0 && (
                <label className="block text-sm">
                  Post to group
                  <select
                    name="groupId"
                    value={managedGroups.some((group) => String(group.id) === String(form.groupId)) ? form.groupId : ""}
                    onChange={update}
                    disabled={Boolean(draftId)}
                    className="mt-2 min-h-11 w-full border border-border bg-background px-3 disabled:opacity-60"
                  >
                    <option value="">No group</option>
                    {managedGroups.map((group) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Publishing notifies current members of the selected group.
                  </span>
                </label>
              )}
              {input("shortDescription", "Short description")}
              {input("brandName", "Organizer / brand name")}
              <LogoUpload label="Organizer logo" value={form.logoImage} onChange={(logoImage) => setForm((current) => ({ ...current, logoImage }))} onBusyChange={setLogoBusy} description="Your branding appears on event emails and tickets. Without a logo, we use your brand name." />
              {errors.logoImage && <p role="alert" className="text-sm text-destructive sm:col-span-2">{errors.logoImage}</p>}
              <label className="block text-sm sm:col-span-2">
                Cover image
                {form.coverImage && (
                  <span className="ml-2 text-xs text-primary">Uploaded</span>
                )}
                {pendingCover && !form.coverImage && (
                  <span className="ml-2 text-xs text-primary">
                    Selected: {pendingCover.name}
                  </span>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={uploadCover}
                  disabled={uploading}
                  className="mt-2 block w-full border border-border bg-background px-3 py-2 text-sm"
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  JPEG, PNG or WebP, maximum 10 MB.
                </span>
                {errors.coverImage && (
                  <span className="mt-1 block text-xs text-destructive">
                    {errors.coverImage}
                  </span>
                )}
              </label>
              <label className="block text-sm">
                Category
                <select
                  required
                  name="categoryId"
                  value={form.categoryId}
                  onChange={update}
                  className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                >
                  <option value="">Select category</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Event type
                <select
                  required
                  name="typeId"
                  value={form.typeId}
                  onChange={update}
                  className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                >
                  <option value="">Select type</option>
                  {types.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="grid gap-4 border border-border p-4 sm:col-span-2 sm:grid-cols-2">
                <legend className="px-1 text-sm font-medium">Where is your event?</legend>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="locationType" value="venue" checked={form.locationType === "venue"} onChange={update} />At a YKCircle venue</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="locationType" value="custom" checked={form.locationType === "custom"} onChange={() => setForm((current) => ({ ...current, locationType: "custom", timezone: deviceTimezone() }))} />At another location</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="locationType" value="online" checked={form.locationType === "online"} onChange={() => setForm((current) => ({ ...current, locationType: "online", timezone: deviceTimezone() }))} />Online</label>
                {form.locationType === "venue" && <VenueBookingPicker venues={venues} venueId={form.venueId} onVenueChange={(venueId) => { const venue = venues.find((item) => String(item.id) === String(venueId)); setForm((current) => ({ ...current, venueId, timezone: venue?.timezone || deviceTimezone() })); setPendingVenueSlot(null); }} selectedDate={selectedVenueDate} onDateChange={(date) => { setForm((current) => ({ ...current, startsAt: `${date}T${current.startsAt?.slice(11, 16) || "09:00"}`, endsAt: current.endsAt ? `${date}T${current.endsAt.slice(11, 16)}` : "" })); setPendingVenueSlot(null); }} schedule={venueSchedule} selectedSlot={pendingVenueSlot} onSelectSlot={setPendingVenueSlot} onConfirmSlot={() => { const clock = (value) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`; setForm((current) => ({ ...current, startsAt: `${venueSchedule.date}T${clock(pendingVenueSlot.selectedStart)}`, endsAt: `${venueSchedule.date}T${clock(pendingVenueSlot.selectedEnd)}`, timezone: venueSchedule.timezone || deviceTimezone() })); }} selectedEventTime={form.startsAt && form.endsAt ? { date: form.startsAt.slice(0, 10), start: form.startsAt.slice(11, 16), end: form.endsAt.slice(11, 16) } : null} />}
                {form.locationType === "custom" && <div className="sm:col-span-2"><p className="text-sm font-medium">Search for an address</p><div className="mt-2"><GoogleLocationPicker onSelect={(place) => setForm((current) => ({ ...current, ...place, country: place.country || current.country, city: place.locality || current.city }))} /></div>{form.formattedAddress ? <p className="mt-3 border border-border bg-secondary/20 p-3 text-sm"><span className="text-muted-foreground">Selected location</span><br />{form.formattedAddress}</p> : <p className="mt-2 text-xs text-muted-foreground">Search and choose an address on the map. Google will save its address details and coordinates automatically.</p>}</div>}
                {form.locationType === "online" && <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2"><p className="sm:col-span-2 text-sm text-muted-foreground">The event is online. Joining links are shown only to the event manager/admin.</p>{input("onlinePlatform", "Platform (for example, Zoom)")}{input("onlineUrl", "Joining URL", "url")}</div>}
              </fieldset>
              {form.locationType !== "venue" && input("startsAt", "Starts", "datetime-local", true)}
              {form.locationType !== "venue" && input("endsAt", "Ends", "datetime-local", true)}
              {form.locationType === "venue" && errors.endsAt && <p role="alert" className="text-sm text-destructive">{errors.endsAt}</p>}
              {creationPage && !draftId && (
                <div className="grid gap-4 border border-border p-4 sm:col-span-2 sm:grid-cols-3">
                  <label className="block text-sm">
                    Repeat
                    <select
                      name="recurrenceFrequency"
                      value={form.recurrenceFrequency}
                      onChange={update}
                      className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                    >
                      <option value="none">Does not repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </label>
                  {form.recurrenceFrequency !== "none" && <>
                    <label className="block text-sm">
                      Every
                      <input required min="1" max="52" name="recurrenceInterval" type="number" value={form.recurrenceInterval} onChange={update} className="mt-2 min-h-11 w-full border border-border bg-background px-3" />
                      <span className="mt-1 block text-xs text-muted-foreground">{form.recurrenceFrequency === "daily" ? "day(s)" : form.recurrenceFrequency === "weekly" ? "week(s)" : "month(s)"}</span>
                    </label>
                    <label className="block text-sm">
                      Occurrences
                      <input required min="2" max="100" name="recurrenceCount" type="number" value={form.recurrenceCount} onChange={update} className="mt-2 min-h-11 w-full border border-border bg-background px-3" />
                      <span className="mt-1 block text-xs text-muted-foreground">Includes the first event.</span>
                    </label>
                  </>}
                  {errors.recurrence && <p className="text-sm text-destructive sm:col-span-3">{errors.recurrence}</p>}
                </div>
              )}
              <label className="block text-sm">Organizing account<select name="organizerOrganizationId" value={form.organizerOrganizationId || ""} onChange={update} disabled={Boolean(draftId)} className="mt-2 min-h-11 w-full border border-border bg-background px-3"><option value="">Personal account</option>{organizers.map(owner => <option key={owner.id} value={owner.id}>{owner.name}</option>)}</select><span className="mt-2 block text-xs text-muted-foreground">Publishing uses this account's subscription. The organizer is fixed when you save the draft.</span></label>
              {productConfiguration.subscriptionsEnabled && <p className="text-sm text-muted-foreground">Drafts are always available. Publishing requires an active subscription or publishing access for the organizing account.</p>}
              <label className="block text-sm">
                Pricing
                <select
                  name="pricingType"
                  value={form.pricingType}
                  onChange={update}
                  className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                >
                  <option value="free">Free</option>
                  <option value="paid" disabled={!productConfiguration.paidEventsEnabled}>Paid{!productConfiguration.paidEventsEnabled ? " (currently unavailable)" : ""}</option>
                </select>
              </label>
              {form.pricingType === "paid" &&
                input("fee", "Fee", "number", true)}
              <label className="block text-sm">
                Event visibility
                <select name="visibility" value={form.visibility} onChange={update} className="mt-2 min-h-11 w-full border border-border bg-background px-3">
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
                {form.visibility === "Public" && <span className="mt-2 block border-l-2 border-amber-500 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-foreground">Public — anyone can view this and it may appear in search engines.</span>}
              </label>
              <label className="block text-sm sm:col-span-2">
                Description
                <textarea
                  required
                  name="description"
                  value={form.description}
                  onChange={update}
                  rows="4"
                  className="mt-2 w-full border border-border bg-background px-3 py-3"
                />
                {errors.description && (
                  <span className="mt-1 block text-xs text-destructive">
                    {errors.description}
                  </span>
                )}
              </label>
              <label className="block text-sm sm:col-span-2">
                Food options <span className="text-muted-foreground">(optional)</span>
                <textarea
                  value={form.foodOptions.join("\n")}
                  onChange={(event) => setForm((current) => ({ ...current, foodOptions: event.target.value.split("\n") }))}
                  rows="3"
                  placeholder={"Vegetarian\nVegan\nChicken"}
                  className="mt-2 w-full border border-border bg-background px-3 py-3"
                />
                <span className="mt-1 block text-xs text-muted-foreground">One option per line, up to 12. These will be shown before someone registers.</span>
                {errors.foodOptions && <span className="mt-1 block text-xs text-destructive">{errors.foodOptions}</span>}
              </label>
              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <button disabled={logoBusy} className="min-h-11 bg-primary px-5 text-sm text-primary-foreground disabled:opacity-60">
                  {logoBusy ? "Preparing logo…" : editPage ? "Save" : "Save draft"}
                </button>
              </div>
            </form>
          </section>
        )}
        {draftSaved && (
          <section className="mt-12 py-10 text-center">
            <p
              ref={draftMessageRef}
              tabIndex="-1"
              className="font-display text-3xl font-semibold text-primary sm:text-4xl"
            >
              {editPage ? "Draft has been saved" : "Draft created"}
            </p>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
              You can edit it, publish it, or delete it below.
            </p>
          </section>
        )}
        {canManage && drafts.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-3xl font-semibold">Drafts</h2>
            <div className="mt-4 space-y-3">
              {drafts.map((event) => (
                <article key={event.id} className="border border-border p-5">
                  <EventCoverImage event={event} component="EventsPageDraft" className="mb-4 aspect-[16/7] w-full object-cover" />
                  <span className="text-xs uppercase tracking-[0.2em] text-primary">
                    Draft
                  </span>
                  <h3 className="mt-2 font-display text-2xl">
                    {event.title || "Untitled experience"}
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`/profile/events/${event.id}/edit`}
                      className="inline-flex min-h-10 items-center border border-border px-4 text-sm"
                    >
                      Edit
                    </a>
                    <button
                      type="button"
                      onClick={() => publishEvent(event.id)}
                      className="min-h-10 bg-primary px-4 text-sm text-primary-foreground"
                    >
                      Publish
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEvent(event.id, true)}
                      className="min-h-10 border border-destructive px-4 text-sm text-destructive"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        <section className="mt-12">
          <h2 className="font-display text-3xl font-semibold">
            {managementOnly ? "Your events" : "Upcoming experiences"}
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loading || (!managementOnly && attending.loading) ? (
              <div className="flex items-center gap-3 py-8 text-muted-foreground">
                <span
                  className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
                  aria-hidden="true"
                />
                Loading events…
              </div>
            ) : active.length === 0 ? (
              <p className="py-6 text-muted-foreground">
                {!managementOnly && attending.events.length ? 'Your events are listed above. No other events match this selection.' : 'No published events are available yet.'}
              </p>
            ) : (
              active.map((event) => (
                <EventPreviewCard key={event.id} event={event}>
                  {event.status !== "Published" && <p className="mb-3 text-xs uppercase tracking-[0.2em] text-primary">{event.status}</p>}
                  {event.seriesId && <p className="mb-3 text-xs text-muted-foreground">Recurring series · occurrence {event.occurrenceNumber || 1} of {event.recurrenceCount || "?"}</p>}
                  {event.groupName && <Link to={`/groups/${event.groupId}${managementOnly ? "?manage=1" : ""}`} className="mb-3 inline-block text-xs font-medium text-primary hover:underline">From {event.groupName}</Link>}
                  {(event.venueBooking?.status === "confirmed" || event.venue_booking?.status === "confirmed") && <p className="mb-3 text-sm text-primary">Confirmed venue: {event.venueBooking?.venue?.name || event.venueBooking?.venueName || event.venue_booking?.venue?.name || event.venue_booking?.venueName}</p>}
                  {canManage ? (
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`/profile/events/${event.id}/edit`}
                        className="inline-flex min-h-10 items-center justify-center border border-border px-3 text-sm"
                      >
                        Edit
                      </a>
                      <a
                        href={`/events/${event.id}?manage=1`}
                        className="inline-flex min-h-10 items-center justify-center bg-primary px-3 text-sm text-primary-foreground"
                      >
                        Manage
                      </a>
                      {event.status !== "Completed" && <button
                        type="button"
                        onClick={() => archiveEvent(event.id)}
                        className="min-h-10 border border-border px-3 text-sm"
                      >
                        Archive
                      </button>}
                      <button
                        type="button"
                        onClick={() => deleteEvent(event.id)}
                        className="min-h-10 border border-destructive px-3 text-sm text-destructive"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <Link
                      to={`/events/${event.id}`}
                      className="inline-flex min-h-10 items-center bg-primary px-4 text-sm text-primary-foreground"
                    >
                      View
                    </Link>
                  )}
                </EventPreviewCard>
              ))
            )}
          </div>
        </section>
        {canManage && archived.length > 0 && (
          <section className="mt-12 border-t border-border pt-10">
            <h2 className="font-display text-3xl font-semibold">Archived events</h2>
            <p className="mt-2 text-sm text-muted-foreground">Archived events are kept here for your records and are not visible to customers.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {archived.map((event) => (
                <article key={event.id} className="relative overflow-hidden border border-border bg-secondary/25 p-4 opacity-75">
                  <div className="pointer-events-none absolute inset-0 z-10 bg-white/35" aria-hidden="true" />
                  <EventCoverImage event={event} component="EventsPageArchived" className="mb-4 aspect-[16/10] w-full object-cover" />
                  <div className="relative z-20">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Archived</p>
                    <h3 className="mt-2 font-display text-2xl text-muted-foreground">{event.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{eventDateTimeLabel(event)}</p>
                  </div>
                  <div className="relative z-20 mt-5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => restoreEvent(event.id)}
                      className="min-h-10 bg-primary px-3 text-sm text-primary-foreground"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEvent(event.id)}
                      className="min-h-10 border border-destructive px-3 text-sm text-destructive"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
      {dialog && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-5"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md border border-border bg-background p-7 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">
              Please confirm
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold">
              {dialog.action === "delete"
                ? dialog.isDraft ? "Delete this draft?" : "Delete this event?"
                : dialog.action === "archive"
                  ? "Archive this event?"
                  : dialog.action === "restore"
                    ? "Restore this event?"
                  : "Publish this event?"}
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {dialog.action === "delete"
                ? dialog.isDraft ? "This draft and its saved details will be permanently removed." : "This event and its saved details will be permanently removed."
                : dialog.action === "archive"
                  ? "Archived events are no longer visible to customers."
                  : dialog.action === "restore"
                    ? "Restoring makes this event visible to customers again."
                  : "Publishing makes this event visible to customers and available for registration."}
            </p>
            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="min-h-11 border border-border px-4 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog}
                className={`min-h-11 px-4 text-sm text-primary-foreground ${dialog.action === "delete" ? "bg-destructive" : "bg-primary"}`}
              >
                {dialog.action === "delete" ? dialog.isDraft ? "Delete draft" : "Delete event" : dialog.action === "archive" ? "Archive event" : dialog.action === "restore" ? "Restore event" : "Publish event"}
              </button>
            </div>
          </div>
        </div>
      )}
      {publishedEvent && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="published-title"
        >
          <div className="w-full max-w-md border border-border bg-background p-8 text-center shadow-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">
              Now live
            </p>
            <h2
              id="published-title"
              className="mt-3 font-display text-4xl font-semibold"
            >
              Event published
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                {publishedEvent.title}
              </span>{" "}
              is now visible to customers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to={`/events/${publishedEvent.id}`}
                className="inline-flex min-h-11 items-center justify-center bg-primary px-5 text-sm text-primary-foreground"
                onClick={() => setPublishedEvent(null)}
              >
                View event
              </Link>
              <button
                type="button"
                onClick={() => setPublishedEvent(null)}
                className="min-h-11 border border-border px-5 text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {savedEvent && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="saved-event-title"
        >
          <div className="w-full max-w-md border border-border bg-background p-8 text-center shadow-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">
              Saved
            </p>
            <h2 id="saved-event-title" className="mt-3 font-display text-4xl font-semibold">
              Event saved
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Your changes have been saved successfully.
            </p>
            <button
              type="button"
              onClick={() => navigate("/profile/events")}
              className="mt-8 min-h-11 bg-primary px-5 text-sm text-primary-foreground"
            >
              Manage events
            </button>
          </div>
        </div>
      )}
    </SiteChrome>
  );
}
