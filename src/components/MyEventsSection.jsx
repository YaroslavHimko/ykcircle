import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import EventPreviewCard from '@/components/EventPreviewCard';

export function useAttendingEvents(token) {
  const [state, setState] = useState({ events: [], loading: Boolean(token), error: '' });
  useEffect(() => {
    if (!token) { setState({ events: [], loading: false, error: '' }); return; }
    let active = true;
    setState({ events: [], loading: true, error: '' });
    apiFetch('/api/my/attending-events', { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load your events.');
        if (active) setState({ events: Array.isArray(data) ? data : [], loading: false, error: '' });
      }).catch(error => { if (active) setState({ events: [], loading: false, error: error.message }); });
    return () => { active = false; };
  }, [token]);
  return state;
}

export default function MyEventsSection({ events, loading, error }) {
  return <section className="mt-10" aria-labelledby="my-events-heading">
    <h2 id="my-events-heading" className="font-display text-3xl font-semibold">My Events</h2>
    <p className="mt-3 text-sm text-muted-foreground">Events you are invited to, registered for, or participating in.</p>
    {loading && <p role="status" className="mt-5 text-muted-foreground">Loading your events…</p>}
    {error && <p role="alert" className="mt-5 text-destructive">{error}</p>}
    {!loading && !error && !events.length && <p className="mt-5 text-muted-foreground">Your invitations and registrations will appear here. Explore events below to find something to join.</p>}
    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{events.map(event => <EventPreviewCard key={event.id} event={event}>
      <div className="flex flex-wrap gap-2 text-xs">
        {event.status !== 'Published' && <span className="border border-border px-3 py-1">{event.status}</span>}
        {event.isInvited && <span className="border border-primary/40 bg-primary/5 px-3 py-1">Invited</span>}
        {event.isRegistered && <span className="border border-border px-3 py-1">Registered</span>}
        {event.isParticipating && <span className="border border-border px-3 py-1">Participating</span>}
      </div>
      {event.isParticipating && event.ticketOrderIds?.length > 0 && <Link to={event.ticketOrderIds.length === 1 ? `/tickets/${event.ticketOrderIds[0]}` : `/account/tickets?eventId=${event.id}`} className="mt-4 inline-flex min-h-11 items-center border border-primary px-4 text-sm text-primary hover:bg-primary/5">Show the ticket</Link>}
    </EventPreviewCard>)}</div>
  </section>;
}
