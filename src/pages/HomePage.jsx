import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import SiteChrome from '@/components/SiteChrome';
import { apiFetch } from '@/lib/api';
import { eventImageRenderDebug, eventMediaUrl } from '@/lib/media';
import { backendInstant } from '@/lib/time';

const interests = [
  { slug: 'music', label: 'Music' },
  { slug: 'sports', label: 'Sport' },
  { slug: 'art', label: 'Art & creativity' },
  { slug: 'culture', label: 'Culture' },
];
const formatDate = (value) => {
  const date = backendInstant(value);
  return date ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date) : 'Date to be announced';
};
const eventLocationLabel = (event) => {
  if (event.locationType === 'online') return 'Online';
  return event.venue?.name || event.venueName || (typeof event.location === 'string' ? event.location : event.location?.formattedAddress || event.location?.locality) || event.city || 'Location to be announced';
};
const priceLabel = (event) => Number(event.fee) > 0 ? `${event.fee} ${event.currency || 'SEK'}` : 'Free';

function EventCard({ event }) {
  const image = eventMediaUrl(event);
  const organizer = event.brandName || event.groupName || event.managerName;
  if (image) eventImageRenderDebug({ component: 'HomeEventCard', event });
  return <Link to={`/events/${event.id}`} className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-background transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">
    <div className="relative aspect-[16/10] overflow-hidden bg-secondary/60">
      {image ? <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-muted-foreground/40"><CalendarDays aria-hidden="true" className="h-12 w-12" strokeWidth={1} /></div>}
      <span className="absolute right-3 top-3 rounded-full bg-background/95 px-3 py-1.5 text-xs font-medium shadow-sm">{priceLabel(event)}</span>
    </div>
    <div className="flex flex-1 flex-col p-5">
      <h3 className="line-clamp-2 text-xl font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">{event.title}</h3>
      {organizer && <p className="mt-2 text-sm text-muted-foreground">By {organizer}</p>}
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p className="flex items-start gap-2"><CalendarDays aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><span>{formatDate(event.startsAt)}</span></p>
        <p className="flex items-start gap-2"><MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><span className="line-clamp-2">{eventLocationLabel(event)}</span></p>
      </div>
      {(event.shortDescription || event.description) && <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{event.shortDescription || event.description}</p>}
    </div>
  </Link>;
}

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
      const upcoming = rows.filter(event => {
        const end = backendInstant(event.endsAt || event.startsAt);
        return event.status === 'Published' && (!end || end.getTime() >= Date.now());
      }).sort((a, b) => (backendInstant(a.startsAt)?.getTime() ?? Infinity) - (backendInstant(b.startsAt)?.getTime() ?? Infinity)).slice(0, 6);
      if (active) setEvents(upcoming);
    }).catch(failure => { if (active) setError(failure.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  return <SiteChrome>
    <Helmet><title>Discover local events | YKCircle</title><meta name="description" content="Explore upcoming events, discover local organizers, and find something you'd love to join." /></Helmet>
    <section className="mx-auto max-w-[90rem] px-5 pb-12 pt-9 sm:px-8 sm:pb-16 sm:pt-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">Find your next event</h1>
      <p className="mt-3 max-w-xl text-base text-muted-foreground">Discover something to do, from the people who make it happen.</p>
      <nav aria-label="Event interests" className="mt-6 flex flex-wrap gap-2">
        <Link to="/events" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">All events <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        {interests.map(interest => <Link key={interest.slug} to={`/events?category=${interest.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{interest.label}</Link>)}
      </nav>
      <div className="mt-9 flex flex-wrap items-center justify-between gap-3 sm:mt-10">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Upcoming events</h2>
        <Link to="/events" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline">View all events <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </div>
      {loading ? <div role="status" aria-label="Loading upcoming events" className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><span className="sr-only">Loading upcoming events…</span>{[1, 2, 3].map(key => <div key={key} aria-hidden="true" className="overflow-hidden rounded-xl border border-border/60"><div className="aspect-[16/10] bg-secondary/60 motion-safe:animate-pulse" /><div className="space-y-3 p-5"><div className="h-5 w-3/4 rounded bg-secondary/60" /><div className="h-4 w-1/2 rounded bg-secondary/40" /><div className="h-4 w-2/3 rounded bg-secondary/40" /></div></div>)}</div>
        : error ? <div className="mt-4 rounded-xl border border-border p-6"><p role="alert" className="text-sm text-muted-foreground">{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-3 min-h-11 text-sm font-medium text-primary underline">Try again</button></div>
          : events.length ? <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{events.map(event => <EventCard key={event.id} event={event} />)}</div>
            : <div className="mt-4 rounded-xl border border-border px-6 py-10 text-center"><CalendarDays aria-hidden="true" className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-lg font-medium">No upcoming events yet</p><p className="mt-2 text-sm text-muted-foreground">Explore local groups or share an event of your own.</p><Link to="/groups" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary underline">Explore groups</Link></div>}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5 text-sm">
        <p className="text-muted-foreground">Organizing something?</p>
        <Link to="/profile/events/new" className="inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline">Create an event <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </div>
    </section>
  </SiteChrome>;
}
