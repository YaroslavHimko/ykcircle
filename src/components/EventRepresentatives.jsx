import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/lib/api';

const button = 'inline-flex min-h-11 items-center justify-center border border-border px-4 py-2 text-sm disabled:opacity-50';

export default function EventRepresentatives({ eventId, token }) {
  const [people, setPeople] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [removing, setRemoving] = useState(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    apiFetch(`/api/events/${eventId}/representatives`, { signal: controller.signal, headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to load representatives.'); return data; })
      .then((data) => { if (!controller.signal.aborted) setPeople(data.representatives); })
      .catch((issue) => { if (!controller.signal.aborted) setError(issue.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [eventId, token, reload]);

  const save = async (userId) => {
    setWorking(true); setError(''); setMessage('');
    try {
      const response = await apiFetch(`/api/events/${eventId}/representatives${userId ? `/${userId}` : ''}`, {
        method: userId ? 'DELETE' : 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...(userId ? {} : { body: JSON.stringify({ email: email.trim() }) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update representatives.');
      setPeople(data.representatives); setRemoving(null);
      if (!userId) setEmail('');
      setMessage(userId ? 'Representative removed. Their check-in access has ended.' : data.alreadyAssigned ? 'This person is already a representative.' : 'Representative assigned. They can now find this event under Manage events.');
    } catch (issue) { setError(issue.message); } finally { setWorking(false); }
  };
  return <section className="rounded-2xl mt-10 border border-border p-5 sm:p-6" aria-labelledby="representatives-title">
    <h2 id="representatives-title" className="font-display text-2xl font-semibold">Event representatives</h2>
    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Assign people to scan tickets and check participants in for this event. Representatives cannot edit event details, billing, venues, or other representatives.</p>
    <form className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); save(); }}>
      <label className="min-w-0 w-full text-sm sm:flex-1" htmlFor="representative-email">Representative email
        <input id="representative-email" required type="email" maxLength={255} value={email} onChange={(event) => setEmail(event.target.value)} disabled={working || loading} autoComplete="email" placeholder="name@example.com" className="mt-2 min-h-11 w-full border border-border bg-background px-3" />
      </label>
      <button disabled={working || loading || !email.trim()} className={`${button} border-primary bg-primary text-primary-foreground`}>{working ? 'Saving...' : 'Assign representative'}</button>
    </form>
    <p className="mt-2 text-xs text-muted-foreground">Use the email of an existing, verified YKCircle account. This role applies only to this event.</p>
    {error && <div role="alert" className="mt-4 text-sm text-destructive">{error} <button type="button" className="underline" disabled={loading || working} onClick={() => setReload((value) => value + 1)}>Reload list</button></div>}
    {message && <p role="status" className="mt-4 text-sm text-primary">{message}</p>}
    {loading ? <p role="status" className="mt-5 text-sm text-muted-foreground">Loading representatives...</p> : people.length ? <ul className="mt-5 divide-y divide-border border-y border-border">
      {people.map((person) => <li key={person.userId} className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="min-w-0"><p className="font-medium">{person.name}</p><p className="break-all text-sm text-muted-foreground">{person.email}</p><p className="mt-1 text-xs text-primary">Event representative · Ticket check-in</p></div>
        {removing === person.userId ? <div className="space-y-2"><p className="text-sm">Remove check-in access?</p><div className="flex gap-2"><button type="button" disabled={working} className={`${button} text-destructive`} onClick={() => save(person.userId)}>Confirm removal</button><button type="button" disabled={working} className={button} onClick={() => setRemoving(null)}>Cancel</button></div></div>
          : <button type="button" disabled={working} className={button} onClick={() => setRemoving(person.userId)}>Remove</button>}
      </li>)}
    </ul> : !error && <p className="mt-5 text-sm text-muted-foreground">No representatives assigned yet.</p>}
    <div className="mt-5 border-t border-border pt-4">
      <Link to={`/events/${eventId}/check-in`} className="text-sm text-primary underline">Open ticket check-in</Link>
      <label className="mt-3 block text-xs text-muted-foreground" htmlFor="representative-link">Share this link with assigned representatives
        <input id="representative-link" readOnly value={`${window.location.origin}/events/${eventId}/check-in`} onFocus={(event) => event.target.select()} className="mt-2 min-h-11 w-full border border-border bg-background px-3 text-sm text-foreground" />
      </label>
    </div>
  </section>;
}

export function RepresentativeEvents({ token }) {
  const [events, setEvents] = useState([]);
  const [state, setState] = useState({ loading: true, error: '' });
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, error: '' });
    apiFetch('/api/me/representative-events', { signal: controller.signal, headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to load assigned events.'); return data; })
      .then((data) => { if (!controller.signal.aborted) { setEvents(data); setState({ loading: false, error: '' }); } })
      .catch((issue) => { if (!controller.signal.aborted) setState({ loading: false, error: issue.message }); });
    return () => controller.abort();
  }, [token, reload]);
  return <section className="rounded-2xl mt-10 border border-border p-5 sm:p-6">
    <h2 className="font-display text-2xl font-semibold">Assigned ticket check-in</h2>
    <p className="mt-2 text-sm text-muted-foreground">Events where you are an event representative.</p>
    {state.loading ? <p role="status" className="mt-4 text-sm">Loading assigned events...</p> : state.error ? <p role="alert" className="mt-4 text-sm text-destructive">{state.error} <button className="underline" onClick={() => setReload((value) => value + 1)}>Try again</button></p> : events.length ? <ul className="mt-4 divide-y divide-border">
      {events.map((event) => <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><h3 className="font-semibold">{event.title}</h3><p className="mt-1 text-xs text-muted-foreground">Event representative · {event.status}</p></div><Link className={`${button} border-primary text-primary`} to={`/events/${event.id}/check-in`}>Open ticket check-in</Link></li>)}
    </ul> : <p className="mt-4 text-sm text-muted-foreground">No events assigned. An organizer can add you using your verified account email.</p>}
  </section>;
}
