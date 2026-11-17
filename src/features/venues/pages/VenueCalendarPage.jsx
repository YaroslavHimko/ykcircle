import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { apiFetch } from '@/shared/api/client.js';
import {
  auth,
  errorText,
  list,
  isoDate,
  atMidnight,
  addDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  time,
  statusLabel,
  entriesFromCalendar,
} from '../model/venue-calendar.js';
import { Shell, Toolbar } from '../components/CalendarShell.jsx';
import { WeekGrid, DayGrid } from '../components/TimeGrid.jsx';
import { MonthGrid } from '../components/MonthGrid.jsx';
import { AvailabilityDialog } from '../components/AvailabilityDialog.jsx';
import { BlockDialog } from '../components/BlockDialog.jsx';
import { Dialog } from '../components/CalendarDialog.jsx';
import { RecurringEditor } from '../components/RecurringEditor.jsx';
export function VenueCalendarPage() {
  const { id } = useParams();
  const [view, setView] = useState(
    () =>
      localStorage.getItem('ykcircle-owner-calendar-view') ||
      (window.innerWidth < 640 ? 'day' : 'week'),
  );
  const [cursor, setCursor] = useState(atMidnight(new Date()));
  const [state, setState] = useState({
    loading: true,
    error: '',
    venue: null,
    entries: [],
    availability: [],
  });
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => localStorage.setItem('ykcircle-owner-calendar-view', view), [view]);
  const range = useMemo(() => {
    const start =
      view === 'month' ? startOfMonth(cursor) : view === 'week' ? startOfWeek(cursor) : cursor;
    const end =
      view === 'month' ? endOfMonth(cursor) : view === 'week' ? addDays(start, 6) : cursor;
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
      const venueResponse = await apiFetch(`/api/venues/${id}`, {
        headers: auth(),
      });
      const venueData = await venueResponse.json();
      if (!venueResponse.ok) throw new Error(errorText(venueData, "We couldn't load this venue."));
      const response = await apiFetch(
        `/api/venues/${id}/calendar?startDate=${range.start}&endDate=${range.end}`,
        {
          headers: auth(),
        },
      );
      const data = response.ok ? await response.json() : {};
      const venue = venueData.venue || venueData;
      const legacyEntries = list(data, 'entries').length
        ? list(data, 'entries')
        : list(data, 'calendarEntries');
      setState({
        loading: false,
        error: response.ok
          ? ''
          : 'Calendar entries are not available yet. You can still manage recurring availability.',
        venue,
        entries: legacyEntries.length ? legacyEntries : entriesFromCalendar(data),
        availability: data.availability || venue.availability || [],
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error.message,
      }));
    }
  }, [id, range.end, range.start]);
  useEffect(() => {
    load();
  }, [load]);
  const saveAvailability = async (availability) => {
    setSaving(true);
    try {
      const response = await apiFetch(`/api/venues/${id}/availability`, {
        method: 'PUT',
        headers: {
          ...auth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          availability,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(errorText(data, 'Unable to save recurring availability.'));
      await load();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.message,
      }));
    } finally {
      setSaving(false);
    }
  };
  const saveDialog = async (form) => {
    const active = dialog;
    setSaving(true);
    try {
      let path = `/api/venues/${id}/availability/overrides`;
      let body = {
        date: isoDate(active.date),
        ...form,
      };
      if (active.kind === 'block') {
        path = `/api/venues/${id}/blocks`;
        body = {
          date: isoDate(active.date),
          ...form,
        };
      }
      if (active.kind === 'reservation') {
        path = `/api/venues/${id}/reservations`;
        body = {
          date: isoDate(active.date),
          ...form,
        };
      }
      if (active.kind === 'availability' && form.appliesTo === 'weekly') {
        const updated = [
          ...state.availability,
          {
            weekday: active.date.getDay(),
            startTime: form.startTime,
            endTime: form.endTime,
          },
        ];
        await saveAvailability(updated);
        setDialog(null);
        return;
      }
      const response = await apiFetch(path, {
        method: 'POST',
        headers: {
          ...auth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(errorText(data, 'Unable to save this calendar change.'));
      setDialog(null);
      await load();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.message,
      }));
    } finally {
      setSaving(false);
    }
  };
  const openDay = (day, initialTime) => {
    setCursor(atMidnight(day));
    setView('day');
    if (initialTime)
      setDialog({
        kind: 'availability',
        date: atMidnight(day),
        initialTime,
      });
  };
  return (
    <Shell title="Venue calendar">
      <Link to="/profile/venues" className="text-sm text-primary underline">
        Back to my venues
      </Link>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Venue scheduling</p>
          <h1 className="mt-2 font-display text-4xl font-bold">
            {state.venue?.name || 'Venue calendar'}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setDialog({
                kind: 'availability',
                date: cursor,
              })
            }
            className="ui-action border border-border px-4 py-3 text-sm"
          >
            Availability
          </button>
          <button
            type="button"
            onClick={() =>
              setDialog({
                kind: 'block',
                date: cursor,
              })
            }
            className="ui-action border border-border px-4 py-3 text-sm"
          >
            Block time
          </button>
          <button
            type="button"
            onClick={() =>
              setDialog({
                kind: 'reservation',
                date: cursor,
              })
            }
            className="ui-action bg-primary px-4 py-3 text-sm text-primary-foreground"
          >
            <Plus className="mr-1 inline h-4 w-4" />
            New reservation
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Venue time: {state.venue?.timezone || 'Venue local time'}. The schedule is a view of backend
        availability and booking state.
      </p>
      <div className="rounded-2xl mt-7 border border-border bg-background p-4 sm:p-6">
        <Toolbar
          view={view}
          setView={setView}
          cursor={cursor}
          setCursor={setCursor}
          timezone={state.venue?.timezone}
          owner
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
            Loading calendar…
          </p>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap gap-3 text-xs">
              <span className="border border-accent/50 bg-accent/10 px-2 py-1">Available</span>
              <span className="border border-amber-600/50 bg-amber-500/10 px-2 py-1">
                Booking request
              </span>
              <span className="border border-primary/50 bg-primary/10 px-2 py-1">
                Confirmed booking
              </span>
              <span className="border border-violet-600/50 bg-violet-500/10 px-2 py-1">
                External reservation
              </span>
              <span className="border border-slate-500/50 bg-slate-500/10 px-2 py-1">Blocked</span>
            </div>
            {view === 'month' ? (
              <MonthGrid cursor={cursor} entries={state.entries} onDay={openDay} />
            ) : view === 'week' ? (
              <WeekGrid
                cursor={cursor}
                entries={state.entries}
                onDay={openDay}
                onEntry={(entry) =>
                  setDialog({
                    kind: 'entry',
                    entry,
                  })
                }
              />
            ) : (
              <DayGrid
                date={cursor}
                entries={state.entries}
                onSelect={(day, initialTime) =>
                  setDialog({
                    kind: 'availability',
                    date: day,
                    initialTime,
                  })
                }
                onEntry={(entry) =>
                  setDialog({
                    kind: 'entry',
                    entry,
                  })
                }
              />
            )}
          </>
        )}
      </div>
      <RecurringEditor
        availability={state.availability}
        onSave={saveAvailability}
        saving={saving}
      />
      {dialog?.kind === 'availability' && (
        <AvailabilityDialog
          date={dialog.date}
          initialTime={dialog.initialTime}
          onClose={() => setDialog(null)}
          onSave={saveDialog}
        />
      )}
      {dialog?.kind === 'block' && (
        <BlockDialog date={dialog.date} onClose={() => setDialog(null)} onSave={saveDialog} />
      )}
      {dialog?.kind === 'reservation' && (
        <BlockDialog
          reservation
          date={dialog.date}
          onClose={() => setDialog(null)}
          onSave={saveDialog}
        />
      )}
      {dialog?.kind === 'entry' && (
        <Dialog title={statusLabel(dialog.entry)} onClose={() => setDialog(null)}>
          <p className="mt-4 text-sm">
            {time(dialog.entry.startTime || dialog.entry.start)}–
            {time(dialog.entry.endTime || dialog.entry.end)}
          </p>
          <p className="mt-2 font-medium">
            {dialog.entry.title ||
              dialog.entry.eventName ||
              dialog.entry.event?.title ||
              'Calendar entry'}
          </p>
          {statusLabel(dialog.entry) === 'Booking request' && (
            <p className="mt-4 text-sm text-muted-foreground">
              Review this request from the booking list. Confirmation remains subject to the backend
              conflict check.
            </p>
          )}
        </Dialog>
      )}
    </Shell>
  );
}
