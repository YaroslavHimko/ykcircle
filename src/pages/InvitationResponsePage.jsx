import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import SiteChrome from '@/components/SiteChrome';
import { apiFetch } from '@/lib/api';

export default function InvitationResponsePage() {
  const [searchParams] = useSearchParams(); const token = searchParams.get('token'); const action = searchParams.get('action');
  const [state, setState] = useState({ loading: true, error: '', status: '', eventId: null, paymentStatus: '' });
  useEffect(() => {
    if (!token || !['accept', 'decline'].includes(action)) { setState({ loading: false, error: 'This invitation link is invalid.', status: '', eventId: null, paymentStatus: '' }); return; }
    apiFetch('/api/invitations/respond', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, action }) }).then(async (response) => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to process invitation.');
      setState({ loading: false, error: '', status: data.status, eventId: data.eventId, paymentStatus: data.paymentStatus || '' });
    }).catch((error) => setState({ loading: false, error: error.message, status: '', eventId: null, paymentStatus: '' }));
  }, [action, token]);
  return <SiteChrome><Helmet><title>Invitation | Yaro Himko</title></Helmet><section className="mx-auto max-w-[38rem] px-5 pb-24 pt-32 text-center sm:px-8 sm:pt-40"><p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">Event invitation</p>{state.loading && <h1 className="mt-4 font-display text-5xl font-black">Processing invitation...</h1>}{state.error && <><h1 className="mt-4 font-display text-5xl font-black">Invitation unavailable.</h1><p className="mt-6 text-destructive">{state.error}</p></>}{!state.loading && !state.error && state.status === 'Pending' && <><h1 className="mt-4 font-display text-5xl font-black">Registration pending organizer approval.</h1><p className="mt-6 leading-relaxed text-muted-foreground">Your invitation was accepted. The organizer will review your registration before you become an event participant.</p>{state.paymentStatus && <p className="mt-4 text-sm text-primary">Payment: {state.paymentStatus}</p>}<Link to={`/events/${state.eventId}`} className="mt-8 inline-flex min-h-12 bg-primary px-7 text-sm uppercase tracking-widest text-primary-foreground">View event status</Link></>}{!state.loading && !state.error && state.status === 'Accepted' && <><h1 className="mt-4 font-display text-5xl font-black">Invitation accepted.</h1><p className="mt-6 leading-relaxed text-muted-foreground">You are now listed as an event participant.</p><Link to={`/events/${state.eventId}`} className="mt-8 inline-flex min-h-12 bg-primary px-7 text-sm uppercase tracking-widest text-primary-foreground">View event</Link></>}{!state.loading && !state.error && state.status === 'Declined' && <><h1 className="mt-4 font-display text-5xl font-black">Invitation declined.</h1><p className="mt-6 leading-relaxed text-muted-foreground">You have declined this event invitation.</p><Link to="/events" className="mt-8 inline-flex min-h-12 border border-border px-7 text-sm uppercase tracking-widest">Browse events</Link></>}</section></SiteChrome>;
}
