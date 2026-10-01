import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import SiteChrome from '@/components/SiteChrome';
import { apiFetch } from '@/lib/api';

export default function MyAttendingEventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { navigate('/login?from=%2Fprofile%2Fmy-events', { replace: true }); return; }
    let active = true;
    apiFetch('/api/my/attending-events', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load your events.');
        if (active) setEvents(Array.isArray(data) ? data : []);
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate]);

  return <SiteChrome><Helmet><title>My events | YKCircle</title><meta name="robots" content="noindex" /></Helmet>
    <section className="mx-auto max-w-4xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
      <p className="text-xs uppercase tracking-[0.25em] text-primary">Your account</p>
      <h1 className="mt-3 font-display text-4xl font-bold">My events</h1>
      <p className="mt-3 text-sm text-muted-foreground">Events you are invited to, registered for, or participating in.</p>
      {loading && <p className="mt-8 text-muted-foreground">Loading events…</p>}
      {error && <p role="alert" className="mt-8 text-destructive">{error}</p>}
      {!loading && !error && events.length === 0 && <p className="mt-8 text-muted-foreground">No invitations or event registrations yet. <Link to="/events" className="text-primary underline">Explore events</Link>.</p>}
      <div className="mt-8 space-y-4">{events.map((event) => <article key={event.id} className="border border-border p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-2xl font-semibold"><Link to={`/events/${event.id}`} className="hover:text-primary">{event.title}</Link></h2><p className="mt-2 text-sm text-muted-foreground">{event.startsAt ? new Date(event.startsAt).toLocaleString() : 'Date to be announced'}{event.location ? ` · ${event.location}` : ''}</p></div>{event.status !== 'Published' && <span className="border border-border px-3 py-1 text-xs">{event.status}</span>}</div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">{event.isInvited && <span className="border border-primary/40 bg-primary/5 px-3 py-1">Invited</span>}{event.isRegistered && <span className="border border-border px-3 py-1">Registered</span>}{event.isParticipating && <span className="border border-border px-3 py-1">Participating</span>}</div>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link to={`/events/${event.id}`} className="text-sm text-primary underline">View event</Link>
          {event.isParticipating && event.ticketOrderIds?.length > 0 && <Link to={event.ticketOrderIds.length === 1 ? `/tickets/${event.ticketOrderIds[0]}` : `/account/tickets?eventId=${event.id}`} className="inline-flex min-h-10 items-center border border-primary px-4 text-sm text-primary hover:bg-primary/5">Show the ticket</Link>}
        </div>
      </article>)}</div>
    </section>
  </SiteChrome>;
}
