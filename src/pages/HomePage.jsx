import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays } from 'lucide-react';
import SiteChrome from '@/components/SiteChrome';
import PageHeader from '@/components/PageHeader';
import { apiFetch } from '@/lib/api';
import EventPreviewCard from '@/components/EventPreviewCard';

const interests = [
  { slug: 'music', label: 'Music' },
  { slug: 'sports', label: 'Sport' },
  { slug: 'art', label: 'Art & creativity' },
  { slug: 'culture', label: 'Culture' },
];
export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    apiFetch('/api/events').then(async response => {
      if (!response.ok) throw new Error('Events could not be loaded. Please try again.');
      const data = await response.json();
      const rows = Array.isArray(data) ? data : data.events || [];
      // The API already puts public events first. Keep its result order and
      // preserve events with older or incomplete dates; otherwise a timezone
      // change or an unmaintained end date can make every published event
      // disappear from the homepage.
      const visible = rows.filter(event => !['archived', 'draft', 'cancelled'].includes(String(event.status || '').toLowerCase())).slice(0, 6);
      if (active) setEvents(visible);
    }).catch(failure => { if (active) setError(failure.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  return <SiteChrome>
    <Helmet><title>Discover local events | YKCircle</title><meta name="description" content="Explore upcoming events, discover local organizers, and find something you'd love to join." /></Helmet>
    <section className="page-container">
      <PageHeader eyebrow="Discover YKCircle" title="Find your next event" description="Discover something to do, from the people who make it happen." />
      <nav aria-label="Event interests" className="mt-6 flex flex-wrap gap-2">
        <Link to="/events" className="ui-action inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">All events <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        {interests.map(interest => <Link key={interest.slug} to={`/events?category=${interest.slug}`} className="ui-action inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{interest.label}</Link>)}
      </nav>
      <div className="mt-9 flex flex-wrap items-center justify-between gap-3 sm:mt-10">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Upcoming events</h2>
        <Link to="/events" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline">View all events <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </div>
      {loading ? <div role="status" aria-label="Loading upcoming events" className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><span className="sr-only">Loading upcoming events…</span>{[1, 2, 3].map(key => <div key={key} aria-hidden="true" className="overflow-hidden rounded-xl border border-border/60"><div className="aspect-[16/10] bg-secondary/60 motion-safe:animate-pulse" /><div className="space-y-3 p-5"><div className="h-5 w-3/4 rounded bg-secondary/60" /><div className="h-4 w-1/2 rounded bg-secondary/40" /><div className="h-4 w-2/3 rounded bg-secondary/40" /></div></div>)}</div>
        : error ? <div className="mt-4 rounded-xl border border-border p-6"><p role="alert" className="text-sm text-muted-foreground">{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-3 min-h-11 text-sm font-medium text-primary underline">Try again</button></div>
          : events.length ? <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{events.map(event => <EventPreviewCard key={event.id} event={event} />)}</div>
            : <div className="mt-4 rounded-xl border border-border px-6 py-10 text-center"><CalendarDays aria-hidden="true" className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-lg font-medium">No upcoming events yet</p><p className="mt-2 text-sm text-muted-foreground">Explore local groups or share an event of your own.</p><Link to="/groups" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary underline">Explore groups</Link></div>}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5 text-sm">
        <p className="text-muted-foreground">Organizing something?</p>
        <Link to="/profile/events/new" className="inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline">Create an event <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </div>
    </section>
  </SiteChrome>;
}
