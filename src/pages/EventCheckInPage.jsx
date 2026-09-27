import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import SiteChrome from '@/components/SiteChrome';
import TicketScanner from '@/components/TicketScanner';
import { apiFetch } from '@/lib/api';

export default function EventCheckInPage() {
  const { id } = useParams();
  const token = localStorage.getItem('authToken');
  const [event, setEvent] = useState(null);
  const [state, setState] = useState({ loading: true, error: '' });
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setEvent(null); setLastCheckIn(null); setState({ loading: true, error: '' });
    apiFetch(`/api/events/${id}/check-in`, { signal: controller.signal, headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to load ticket check-in.'); return data; })
      .then((data) => { if (!controller.signal.aborted) { setEvent(data); setState({ loading: false, error: '' }); } })
      .catch((issue) => { if (!controller.signal.aborted) setState({ loading: false, error: issue.message }); });
    return () => controller.abort();
  }, [id, token, reload]);
  return <SiteChrome><Helmet><title>Ticket check-in | YKCircle</title><meta name="robots" content="noindex" /></Helmet>
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
      <Link to="/profile/events" className="text-sm text-primary underline">Manage events</Link>
      <h1 className="mt-6 font-display text-4xl font-semibold">Ticket check-in</h1>
      {!token ? <div className="mt-6"><p>Log in with the account assigned by the event organizer.</p><Link className="mt-4 inline-flex min-h-11 items-center bg-primary px-5 text-primary-foreground" to={`/login?from=${encodeURIComponent(`/events/${id}/check-in`)}`}>Log in</Link></div>
        : state.loading ? <p role="status" className="mt-6">Loading event...</p>
        : state.error ? <div role="alert" className="mt-6 border border-destructive/30 p-5"><p>{state.error}</p><button className="mt-4 text-primary underline" onClick={() => setReload((value) => value + 1)}>Try again</button></div>
        : event && <section className="mt-6 border border-border p-5 sm:p-6">
          <p className="text-xs uppercase tracking-widest text-primary">{event.accessRole === 'representative' ? 'Event representative' : 'Event organizer'}</p>
          <h2 className="mt-3 font-display text-3xl font-semibold">{event.title}</h2>
          <p className="mt-3 text-sm text-muted-foreground">Scan a ticket QR code to mark its participant as attended. You can also enter a ticket code manually.</p>
          <div className="mt-6">{['Published', 'Completed'].includes(event.status) ? <TicketScanner key={event.id} eventId={event.id} eventTitle={event.title} token={token} onCheckIn={setLastCheckIn} /> : <p>Ticket check-in is unavailable while this event is {event.status.toLowerCase()}.</p>}</div>
          {lastCheckIn && <p role="status" className="mt-5 border-t border-border pt-4 text-sm">{lastCheckIn.participant?.name || 'Ticket holder'}: {lastCheckIn.alreadyCheckedIn ? 'already checked in' : 'marked as attended'}.</p>}
        </section>}
    </main>
  </SiteChrome>;
}
