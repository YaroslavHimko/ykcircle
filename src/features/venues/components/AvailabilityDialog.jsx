import { useState } from 'react';
import { DAYS, isoDate, readableDate } from '../model/venue-calendar.js';
import { Dialog, TimeField } from './CalendarDialog.jsx';
export function AvailabilityDialog({ date, initialTime = '09:00', onClose, onSave }) {
  const [form, setForm] = useState({
    startTime: initialTime,
    endTime: '17:00',
    appliesTo: 'date',
  });
  return (
    <Dialog title="Add availability" onClose={onClose}>
      <p className="text-sm text-muted-foreground">{readableDate(isoDate(date))}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
        className="mt-5 grid gap-4 sm:grid-cols-2"
      >
        <TimeField
          label="Start"
          value={form.startTime}
          onChange={(value) =>
            setForm({
              ...form,
              startTime: value,
            })
          }
        />
        <TimeField
          label="End"
          value={form.endTime}
          onChange={(value) =>
            setForm({
              ...form,
              endTime: value,
            })
          }
        />
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium">Apply to</legend>
          <label className="mt-2 block text-sm">
            <input
              type="radio"
              checked={form.appliesTo === 'date'}
              onChange={() =>
                setForm({
                  ...form,
                  appliesTo: 'date',
                })
              }
            />{' '}
            This date only
          </label>
          <label className="mt-2 block text-sm">
            <input
              type="radio"
              checked={form.appliesTo === 'weekly'}
              onChange={() =>
                setForm({
                  ...form,
                  appliesTo: 'weekly',
                })
              }
            />{' '}
            Every {DAYS[date.getDay()]}
          </label>
        </fieldset>
        <button className="ui-action justify-self-start bg-primary px-5 py-3 text-sm text-primary-foreground">
          Save availability
        </button>
      </form>
    </Dialog>
  );
}
