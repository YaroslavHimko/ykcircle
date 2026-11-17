import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '@/shared/api/client.js';
import {
  errorText,
  list,
  isoDate,
  atMidnight,
  addDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  time,
  dateForEntry,
} from '../model/venue-calendar.js';
import { Shell, Toolbar } from '../components/CalendarShell.jsx';
import { WeekGrid, DayGrid } from '../components/TimeGrid.jsx';
import { MonthGrid } from '../components/MonthGrid.jsx';
import { PartialBookingRequestDialog } from '../components/BookingRequestDialog.jsx';
export function OrganizerAvailabilityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState('week');
  const [cursor, setCursor] = useState(atMidnight(new Date()));
  const [state, setState] = useState({
    loading: true,
    error: '',
    venue: null,
    slots: [],
    calendarSlots: [],
    timezone: '',
  });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const date = isoDate(cursor);
  const visibleRange = useMemo(() => {
    const start =
      view === 'month' ? startOfMonth(cursor) : view === 'week' ? startOfWeek(cursor) : cursor;
    const end =
      view === 'month' ? endOfMonth(cursor) : view === 'week' ? addDays(start, 4) : cursor;
    return {
      start: isoDate(start),
      end: isoDate(end),
    };
  }, [cursor, view]);
  const load = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: true,
      error: '',
    }));
    try {
      const [venueResponse, availabilityResponse, rangeResponse] = await Promise.all([
        apiFetch(`/api/venues/${id}`),
        apiFetch(`/api/venues/${id}/availability?date=${encodeURIComponent(date)}`),
        apiFetch(
          `/api/venues/${id}/availability?from=${visibleRange.start}&to=${visibleRange.end}`,
        ),
      ]);
      const venueData = await venueResponse.json();
      const availabilityData = await availabilityResponse.json();
      const rangeData = rangeResponse.ok ? await rangeResponse.json() : {};
      if (!venueResponse.ok) throw new Error(errorText(venueData, "We couldn't load this venue."));
      if (!availabilityResponse.ok)
        throw new Error(
          errorText(availabilityData, "We couldn't load availability. Try another date."),
        );
      const slots = list(availabilityData, 'slots').length
        ? list(availabilityData, 'slots')
        : availabilityData.availableIntervals || [];
      const calendarSlots = [
        ...list(rangeData, 'dates').flatMap((day) =>
          list(day, 'availableIntervals').map((slot, index) => ({
            ...slot,
            id: `available-${day.date}-${index}`,
            date: day.date,
            type: 'availability',
            startTime: slot.startTime || slot.start,
            endTime: slot.endTime || slot.end,
          })),
        ),
        ...list(rangeData, 'dates').flatMap((day) =>
          list(day, 'unavailableIntervals').map((slot, index) => ({
            ...slot,
            id: `unavailable-${day.date}-${index}`,
            date: day.date,
            type: 'blocked',
            startTime: slot.startTime || slot.start,
            endTime: slot.endTime || slot.end,
          })),
        ),
      ];
      setState({
        ...availabilityData,
        loading: false,
        error: '',
        venue: venueData.venue || venueData,
        slots,
        calendarSlots,
        timezone: availabilityData.timezone || (venueData.venue || venueData).timezone || '',
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error.message,
      }));
    }
  }, [date, id, visibleRange.end, visibleRange.start]);
  useEffect(() => {
    load();
  }, [load]);
  const entries = state.calendarSlots.length
    ? state.calendarSlots
    : state.slots.map((slot) => ({
        ...slot,
        date,
        type: 'availability',
        startTime: slot.startTime || slot.start,
        endTime: slot.endTime || slot.end,
      }));
  const selectDay = (day) => {
    setCursor(atMidnight(day));
    setView('day');
  };
  const requestSlot = (slot) => {
    if (!localStorage.getItem('authToken')) {
      navigate(`/login?from=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setSelectedSlot({
      ...slot,
      selectedDate: dateForEntry(slot) || date,
    });
  };
  return (
    <Shell title="Check availability">
      <Link to={`/venues/${id}`} className="text-sm text-primary underline">
        Back to venue
      </Link>
      <div className="mt-5">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">Book a venue</p>
        <h1 className="mt-2 font-display text-4xl font-bold">
          Check availability{state.venue?.name ? ` at ${state.venue.name}` : ''}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Select any visible free interval to choose your event time. Other reservations and
          internal details are private.
        </p>
      </div>
      <div className="rounded-2xl mt-7 border border-border bg-background p-4 sm:p-6">
        <Toolbar
          view={view}
          setView={setView}
          cursor={cursor}
          setCursor={setCursor}
          timezone={state.timezone}
        />
        {state.error && (
          <p
            role="alert"
            className="rounded-2xl mt-5 border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {state.error}
          </p>
        )}
        {state.loading ? (
          <p role="status" className="mt-8 text-muted-foreground">
            Loading availability…
          </p>
        ) : view === 'month' ? (
          <MonthGrid cursor={cursor} entries={entries} onDay={selectDay} publicView />
        ) : view === 'week' ? (
          <WeekGrid
            cursor={cursor}
            entries={entries}
            onDay={selectDay}
            onEntry={requestSlot}
            publicView
          />
        ) : (
          <>
            <DayGrid
              date={cursor}
              entries={entries}
              onSelect={() => {}}
              onEntry={requestSlot}
              publicView
            />
            <section className="mt-6 border-t border-border pt-5">
              <h2 className="font-display text-2xl font-semibold">Available intervals</h2>
              {state.slots.length ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  {state.slots.map((slot, index) => (
                    <button
                      key={`${slot.startTime || slot.start}-${slot.endTime || slot.end}-${index}`}
                      type="button"
                      onClick={() => requestSlot(slot)}
                      className="ui-action border border-accent/50 bg-accent/10 px-4 py-3 text-sm"
                    >
                      {time(slot.startTime || slot.start)}–{time(slot.endTime || slot.end)}{' '}
                      <span className="block text-xs">Choose a time</span>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <p className="mt-4 text-sm text-muted-foreground">
                    No scheduled hours are available on this date.
                  </p>
                  {state.nextAvailable?.date && (
                    <button
                      type="button"
                      onClick={() => {
                        setCursor(atMidnight(new Date(`${state.nextAvailable.date}T12:00:00`)));
                        setView('day');
                      }}
                      className="ui-action mt-4 border border-accent/50 bg-accent/10 px-4 py-3 text-left text-sm hover:bg-accent/20"
                    >
                      <strong>Next available: {state.nextAvailable.date}</strong>
                      <span className="ml-2">
                        {time(state.nextAvailable.startTime)}–{time(state.nextAvailable.endTime)}
                      </span>
                      <span className="mt-1 block text-xs">View this date</span>
                    </button>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </div>
      {selectedSlot && (
        <PartialBookingRequestDialog
          venueId={id}
          venueName={state.venue?.name}
          date={selectedSlot.selectedDate}
          slot={selectedSlot}
          availability={state}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </Shell>
  );
}
