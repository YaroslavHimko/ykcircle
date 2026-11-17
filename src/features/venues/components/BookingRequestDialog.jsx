import { useState } from 'react';
import { apiFetch } from '@/shared/api/client.js';
import { auth, input, errorText, time, readableDate } from '../model/venue-calendar.js';
import { Dialog } from './CalendarDialog.jsx';
export function PartialBookingRequestDialog({
  venueId,
  venueName,
  date,
  slot,
  availability,
  onClose,
}) {
  const toMinutes = (value) => {
    const [hours = 0, minutes = 0] = String(value || '00:00')
      .slice(0, 5)
      .split(':')
      .map(Number);
    return hours * 60 + minutes;
  };
  const toTime = (value) =>
    `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  const positive = (...values) =>
    values.map(Number).find((value) => Number.isFinite(value) && value > 0);
  const increment = positive(availability.slotIncrementMinutes, availability.slotIncrement) || 60;
  const minimum =
    positive(
      availability.minimumDurationMinutes,
      availability.minDurationMinutes,
      availability.minimumDuration,
      availability.minimumBookingMinutes,
      Number(availability.minimumBookingHours) * 60,
    ) || increment;
  const maximum =
    positive(
      availability.maximumDurationMinutes,
      availability.maxDurationMinutes,
      availability.maximumDuration,
      availability.maximumBookingMinutes,
      Number(availability.maximumBookingHours) * 60,
    ) || Infinity;
  const slotStart = toMinutes(slot.startTime || slot.start);
  const slotEnd = toMinutes(slot.endTime || slot.end);
  const initialEnd = () => {
    const longest = Math.min(slotEnd - slotStart, maximum);
    return slotStart + minimum + Math.floor((longest - minimum) / increment) * increment;
  };
  const [range, setRange] = useState(() => ({
    start: slotStart,
    end: initialEnd(),
  }));
  const [form, setForm] = useState({
    eventName: '',
    expectedGuests: '',
    message: '',
  });
  const [state, setState] = useState({
    saving: false,
    error: '',
    success: false,
  });
  const startOptions = Array.from(
    {
      length: Math.max(0, Math.floor((slotEnd - slotStart - minimum) / increment) + 1),
    },
    (_, index) => slotStart + index * increment,
  );
  const endOptions = Array.from(
    {
      length: Math.max(
        0,
        Math.floor((Math.min(slotEnd, range.start + maximum) - range.start - minimum) / increment) +
          1,
      ),
    },
    (_, index) => range.start + minimum + index * increment,
  );
  const updateStart = (value) => {
    const start = Number(value);
    const validEnd =
      range.end > start &&
      range.end - start >= minimum &&
      range.end - start <= maximum &&
      range.end <= slotEnd &&
      (range.end - start - minimum) % increment === 0;
    setRange({
      start,
      end: validEnd ? range.end : start + minimum,
    });
  };
  const submit = async (event) => {
    event.preventDefault();
    setState({
      saving: true,
      error: '',
      success: false,
    });
    try {
      const response = await apiFetch(`/api/venues/${venueId}/inquiries`, {
        method: 'POST',
        headers: {
          ...auth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventName: form.eventName,
          expectedGuests: form.expectedGuests ? Number(form.expectedGuests) : undefined,
          message: form.message,
          requestedDate: date,
          startTime: toTime(range.start),
          endTime: toTime(range.end),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(errorText(data, 'Unable to send booking request.'));
      setState({
        saving: false,
        error: '',
        success: true,
      });
    } catch (error) {
      setState({
        saving: false,
        error: error.message,
        success: false,
      });
    }
  };
  return (
    <Dialog title={state.success ? 'Booking request sent' : 'Request a time'} onClose={onClose}>
      {state.success ? (
        <p className="mt-4 text-muted-foreground">
          {venueName || 'The venue'} received your request. It is not confirmed until the venue
          accepts it.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            {readableDate(date)} · Select a time within the free {toTime(slotStart)}–
            {toTime(slotEnd)} interval.
          </p>
          <form onSubmit={submit} className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Start
                <select
                  value={range.start}
                  onChange={(event) => updateStart(event.target.value)}
                  className={input}
                >
                  {startOptions.map((value) => (
                    <option key={value} value={value}>
                      {toTime(value)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                End
                <select
                  value={range.end}
                  onChange={(event) =>
                    setRange((current) => ({
                      ...current,
                      end: Number(event.target.value),
                    }))
                  }
                  className={input}
                >
                  {endOptions.map((value) => (
                    <option key={value} value={value}>
                      {toTime(value)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-sm">
              Requesting:{' '}
              <strong>
                {toTime(range.start)}–{toTime(range.end)}
              </strong>
            </p>
            <label className="text-sm font-medium">
              Event name
              <input
                required
                value={form.eventName}
                onChange={(event) =>
                  setForm({
                    ...form,
                    eventName: event.target.value,
                  })
                }
                className={input}
              />
            </label>
            <label className="text-sm font-medium">
              Expected guests
              <input
                type="number"
                min="1"
                value={form.expectedGuests}
                onChange={(event) =>
                  setForm({
                    ...form,
                    expectedGuests: event.target.value,
                  })
                }
                className={input}
              />
            </label>
            <label className="text-sm font-medium">
              Message
              <input
                required
                value={form.message}
                onChange={(event) =>
                  setForm({
                    ...form,
                    message: event.target.value,
                  })
                }
                className={input}
              />
            </label>
            {state.error && (
              <p role="alert" className="text-sm text-destructive">
                {state.error}
              </p>
            )}
            <button
              disabled={state.saving}
              className="ui-action justify-self-start bg-primary px-5 py-3 text-sm text-primary-foreground disabled:opacity-60"
            >
              {state.saving ? 'Sending…' : 'Request booking'}
            </button>
          </form>
        </>
      )}
    </Dialog>
  );
}
export function BookingRequestDialog({ venueId, venueName, date, slot, onClose }) {
  const [form, setForm] = useState({
    eventName: '',
    expectedGuests: '',
    message: '',
  });
  const [state, setState] = useState({
    saving: false,
    error: '',
    success: false,
  });
  const submit = async (event) => {
    event.preventDefault();
    setState({
      saving: true,
      error: '',
      success: false,
    });
    try {
      const response = await apiFetch(`/api/venues/${venueId}/inquiries`, {
        method: 'POST',
        headers: {
          ...auth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventName: form.eventName,
          expectedGuests: form.expectedGuests ? Number(form.expectedGuests) : undefined,
          message: form.message,
          requestedDate: date,
          startTime: time(slot.startTime || slot.start),
          endTime: time(slot.endTime || slot.end),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(errorText(data, 'Unable to send booking request.'));
      setState({
        saving: false,
        error: '',
        success: true,
      });
    } catch (error) {
      setState({
        saving: false,
        error: error.message,
        success: false,
      });
    }
  };
  return (
    <Dialog title={state.success ? 'Booking request sent' : 'Request this time'} onClose={onClose}>
      {state.success ? (
        <p className="mt-4 text-muted-foreground">
          {venueName || 'The venue'} received your request. It is not confirmed until the venue
          accepts it.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            {readableDate(date)} · {time(slot.startTime || slot.start)}–
            {time(slot.endTime || slot.end)}
          </p>
          <form onSubmit={submit} className="mt-5 grid gap-4">
            <label className="text-sm font-medium">
              Event name
              <input
                required
                value={form.eventName}
                onChange={(event) =>
                  setForm({
                    ...form,
                    eventName: event.target.value,
                  })
                }
                className={input}
              />
            </label>
            <label className="text-sm font-medium">
              Expected guests
              <input
                type="number"
                min="1"
                value={form.expectedGuests}
                onChange={(event) =>
                  setForm({
                    ...form,
                    expectedGuests: event.target.value,
                  })
                }
                className={input}
              />
            </label>
            <label className="text-sm font-medium">
              Message
              <input
                required
                value={form.message}
                onChange={(event) =>
                  setForm({
                    ...form,
                    message: event.target.value,
                  })
                }
                className={input}
              />
            </label>
            {state.error && (
              <p role="alert" className="text-sm text-destructive">
                {state.error}
              </p>
            )}
            <button
              disabled={state.saving}
              className="ui-action justify-self-start bg-primary px-5 py-3 text-sm text-primary-foreground disabled:opacity-60"
            >
              {state.saving ? 'Sending…' : 'Request booking'}
            </button>
          </form>
        </>
      )}
    </Dialog>
  );
}
