import { useEffect, useState } from 'react';
import { DAYS, time } from '../model/venue-calendar.js';
import { TimeField } from './CalendarDialog.jsx';
export function RecurringEditor({ availability, onSave, saving }) {
  const [slots, setSlots] = useState(availability || []);
  useEffect(() => setSlots(availability || []), [availability]);
  const update = (index, key, value) =>
    setSlots((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    );
  return (
    <section className="rounded-2xl mt-8 border border-border p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">Recurring availability</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Multiple intervals per weekday are supported.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setSlots((current) => [
              ...current,
              {
                weekday: 1,
                startTime: '09:00',
                endTime: '17:00',
              },
            ])
          }
          className="ui-action border border-border px-3 py-2 text-sm"
        >
          + Add hours
        </button>
      </div>
      <div className="mt-5 space-y-3">
        {slots.map((slot, index) => (
          <div key={`${slot.weekday}-${index}`} className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              Day
              <select
                value={slot.weekday}
                onChange={(event) => update(index, 'weekday', Number(event.target.value))}
                className="ml-2 min-h-10 border border-border bg-background px-2"
              >
                {DAYS.map((day, dayIndex) => (
                  <option key={day} value={dayIndex}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <TimeField
              label="Start"
              value={time(slot.startTime)}
              onChange={(value) => update(index, 'startTime', value)}
            />
            <TimeField
              label="End"
              value={time(slot.endTime)}
              onChange={(value) => update(index, 'endTime', value)}
            />
            <button
              type="button"
              onClick={() =>
                setSlots((current) => current.filter((_, itemIndex) => itemIndex !== index))
              }
              className="min-h-10 text-sm text-destructive"
            >
              Remove
            </button>
          </div>
        ))}
        {!slots.length && (
          <p className="text-sm text-muted-foreground">No recurring hours configured.</p>
        )}
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={() => onSave(slots)}
        className="ui-action mt-5 bg-primary px-5 py-3 text-sm text-primary-foreground disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save recurring availability'}
      </button>
    </section>
  );
}
