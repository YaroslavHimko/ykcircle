import { useState } from 'react';
import { apiFetch } from '@/shared/api/client.js';
import {
  venueId,
  authHeaders,
  inputClass,
  textareaClass,
  getError,
  toNumber,
} from '../model/venue-marketplace.js';
export function InquiryForm({ venue, onClose }) {
  const [form, setForm] = useState({
    eventName: '',
    eventType: '',
    requestedDate: '',
    startTime: '',
    endTime: '',
    expectedGuests: '',
    budget: '',
    message: '',
  });
  const [state, setState] = useState({
    saving: false,
    error: '',
    success: false,
  });
  const update = (key) => (event) =>
    setForm((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  const submit = async (event) => {
    event.preventDefault();
    setState({
      saving: true,
      error: '',
      success: false,
    });
    try {
      const id = venueId(venue);
      if (id == null)
        throw new Error('This venue is missing its ID and cannot receive requests yet.');
      const payload = {
        ...form,
        expectedGuests: toNumber(form.expectedGuests),
        budget: toNumber(form.budget),
      };
      const response = await apiFetch(`/api/venues/${id}/inquiries`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(getError(data, 'Unable to send your venue request.'));
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
  if (state.success)
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-5">
        <section
          role="dialog"
          aria-modal="true"
          className="rounded-2xl w-full max-w-lg border border-border bg-background p-6 shadow-xl"
        >
          <h2 className="font-display text-3xl">Request sent</h2>
          <p className="mt-3 text-muted-foreground">
            {venue.name} has received your request. This is an inquiry, not a confirmed booking.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="ui-action mt-6 bg-primary px-5 py-3 text-sm text-primary-foreground"
          >
            Done
          </button>
        </section>
      </div>
    );
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/50 px-5 py-8">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-title"
        className="rounded-2xl mx-auto max-w-2xl border border-border bg-background p-6 shadow-xl"
      >
        <div className="flex justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-primary">Venue request</p>
            <h2 id="inquiry-title" className="mt-2 font-display text-3xl">
              Request {venue.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-action h-10 border border-border px-3 text-sm"
          >
            Close
          </button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          This sends an inquiry to the venue. It does not reserve the space or take payment.
        </p>
        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Event name *
            <input
              required
              value={form.eventName}
              onChange={update('eventName')}
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium">
            Event type
            <input value={form.eventType} onChange={update('eventType')} className={inputClass} />
          </label>
          <label className="text-sm font-medium">
            Preferred date
            <input
              type="date"
              value={form.requestedDate}
              onChange={update('requestedDate')}
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium">
            Expected guests
            <input
              type="number"
              min="1"
              value={form.expectedGuests}
              onChange={update('expectedGuests')}
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium">
            Start time
            <input
              type="time"
              value={form.startTime}
              onChange={update('startTime')}
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium">
            End time
            <input
              type="time"
              value={form.endTime}
              onChange={update('endTime')}
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium">
            Budget (optional)
            <input
              type="number"
              min="0"
              value={form.budget}
              onChange={update('budget')}
              className={inputClass}
            />
          </label>
          <label className="sm:col-span-2 text-sm font-medium">
            Message *
            <textarea
              required
              value={form.message}
              onChange={update('message')}
              className={textareaClass}
            />
          </label>
          {state.error && (
            <p role="alert" className="sm:col-span-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
          <button
            disabled={state.saving}
            className="ui-action sm:col-span-2 justify-self-start bg-primary px-5 py-3 text-sm text-primary-foreground disabled:opacity-60"
          >
            {state.saving ? 'Sending…' : 'Send venue request'}
          </button>
        </form>
      </section>
    </div>
  );
}
