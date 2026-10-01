import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin } from 'lucide-react';
import { eventImageRenderDebug, eventMediaUrl } from '@/lib/media';
import { backendInstant } from '@/lib/time';

const formatDate = (value) => {
  const date = backendInstant(value);
  return date ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date) : 'Date to be announced';
};
const eventLocationLabel = (event) => {
  if (event.locationType === 'online') return 'Online';
  return event.venue?.name || event.venueName || (typeof event.location === 'string' ? event.location : event.location?.formattedAddress || event.location?.locality) || event.city || 'Location to be announced';
};
const priceLabel = (event) => Number(event.fee) > 0 ? `${event.fee} ${event.currency || 'SEK'}` : 'Free';

export default function EventPreviewCard({ event, children }) {
  const image = eventMediaUrl(event);
  const organizer = event.brandName || event.groupName || event.managerName;
  if (image) eventImageRenderDebug({ component: 'HomeEventCard', event });
  return <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-background transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">
    <Link to={`/events/${event.id}`} className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
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
    </Link>
    {children && <div className="border-t border-border/60 p-5 pt-4">{children}</div>}
  </article>;
}
