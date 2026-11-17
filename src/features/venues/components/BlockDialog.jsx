import { useState } from 'react';
import { input, isoDate, readableDate } from '../model/venue-calendar.js';
import { Dialog, TimeField } from './CalendarDialog.jsx';
export function BlockDialog({ date, onClose, onSave, reservation = false }) {
  const [form, setForm] = useState({
    startTime: '09:00',
    endTime: '17:00',
    title: '',
    source: reservation ? 'external' : 'block',
    allDay: false,
  });
  return (
    <Dialog title={reservation ? 'Add reservation' : 'Mark unavailable'} onClose={onClose}>
      <p className="text-sm text-muted-foreground">{readableDate(isoDate(date))}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
        className="mt-5 grid gap-4 sm:grid-cols-2"
      >
        {!reservation && (
          <label className="sm:col-span-2 text-sm">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(event) =>
                setForm({
                  ...form,
                  allDay: event.target.checked,
                })
              }
            />{' '}
            Unavailable all day
          </label>
        )}
        <TimeField
          label="Start"
          value={form.startTime}
          disabled={form.allDay}
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
          disabled={form.allDay}
          onChange={(value) =>
            setForm({
              ...form,
              endTime: value,
            })
          }
        />
        {reservation && (
          <label className="sm:col-span-2 text-sm font-medium">
            Title (optional)
            <input
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title: event.target.value,
                })
              }
              className={input}
            />
          </label>
        )}
        {reservation && (
          <label className="sm:col-span-2 text-sm font-medium">
            Source
            <select
              value={form.source}
              onChange={(event) =>
                setForm({
                  ...form,
                  source: event.target.value,
                })
              }
              className={input}
            >
              <option value="external">External</option>
              <option value="internal">Internal</option>
              <option value="ykcircle">YKCircle</option>
            </select>
          </label>
        )}
        {!reservation && (
          <label className="sm:col-span-2 text-sm font-medium">
            Internal reason (optional)
            <select
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title: event.target.value,
                })
              }
              className={input}
            >
              <option value="">No reason</option>
              <option>Maintenance</option>
              <option>Private use</option>
              <option>Cleaning</option>
              <option>Holiday</option>
              <option>Other</option>
            </select>
          </label>
        )}
        <button className="ui-action justify-self-start bg-primary px-5 py-3 text-sm text-primary-foreground">
          Save
        </button>
      </form>
    </Dialog>
  );
}
