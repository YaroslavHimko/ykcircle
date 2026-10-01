import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Check, Clock3, Globe2, MapPin, Star, Users, X } from 'lucide-react';
import MapLocation from '@/components/MapLocation';
import { eventMediaUrl } from '@/lib/media';

export default function EventExperience({ event, location, locationText, dateLabel, canManage, participates, registrationStatus, canWithdraw, onRegister, onWithdraw }) {
  const [failedImage, setFailedImage] = useState('');
  const cover = eventMediaUrl(event);
  const paid = event.pricingType === 'paid' || Number(event.fee) > 0;
  const closed = ['Completed', 'Cancelled', 'Archived'].includes(event.status);
  const organizer = event.brandName || event.groupName || event.managerName;
  const primary = 'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4';
  return <div className="mt-7">
    <header className="max-w-4xl">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium"><span className="rounded-full bg-primary/10 px-3 py-1.5 text-primary">{event.categoryName || event.category || 'Experience'}</span><span className="rounded-full bg-secondary/60 px-3 py-1.5">{event.typeName || event.type || 'Event'}</span>{event.status !== 'Published' && <span className="rounded-full border border-border px-3 py-1.5">{event.status}</span>}</div>
      <h1 className="mt-5 break-words font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">{event.title}</h1>
      {event.shortDescription && <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">{event.shortDescription}</p>}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
        {organizer && <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" aria-hidden="true" />Hosted by {event.groupId ? <Link to={`/groups/${event.groupId}`} className="font-medium text-foreground hover:text-primary">{organizer}</Link> : <strong className="font-medium text-foreground">{organizer}</strong>}</span>}
        {Number(event.ratingCount) > 0 && <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-primary text-primary" aria-hidden="true" /><strong className="text-foreground">{Number(event.ratingAverage).toFixed(1)}</strong>({event.ratingCount} {Number(event.ratingCount) === 1 ? 'rating' : 'ratings'})</span>}
      </div>
    </header>
    <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10">
      <div className="contents lg:block lg:min-w-0 lg:space-y-9">
        <div className="relative order-1 aspect-[16/10] overflow-hidden rounded-2xl bg-secondary/50 sm:aspect-[16/9]">
          {cover && failedImage !== cover ? <img src={cover} alt={`${event.title} cover`} onError={() => setFailedImage(cover)} className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-primary/10 via-secondary/40 to-primary/5 text-primary/50"><CalendarDays className="h-16 w-16" strokeWidth={1} aria-hidden="true" /><span className="text-sm font-medium">An experience to look forward to</span></div>}
        </div>
        <section className="order-3" aria-labelledby="about-event"><h2 id="about-event" className="text-2xl font-semibold tracking-tight">About this experience</h2><p className="mt-4 whitespace-pre-wrap break-words leading-8 text-muted-foreground">{event.description || event.shortDescription || 'The organizer will share more details soon.'}</p></section>
        <section className="order-4 rounded-2xl border border-border/70 p-5 sm:p-6" aria-labelledby="event-location"><div className="flex items-start gap-3"><span className="rounded-xl bg-secondary/70 p-3">{event.locationType === 'online' ? <Globe2 className="h-5 w-5" aria-hidden="true" /> : <MapPin className="h-5 w-5" aria-hidden="true" />}</span><div><h2 id="event-location" className="text-xl font-semibold">{event.locationType === 'online' ? 'Join from anywhere' : 'Where we’ll meet'}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{locationText}</p></div></div>
          {event.locationType !== 'online' && <div className="mt-5 overflow-hidden rounded-xl"><MapLocation location={location} label={event.venue?.name || event.title} hidden={event.locationVisibility === 'private' || event.venue?.locationVisibility === 'private' || event.venue?.locationVisibility === 'private_until_booking'} /></div>}
          {event.locationType === 'venue' && event.venue?.id && <Link className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary" to={event.venue.slug ? `/venues/slug/${event.venue.slug}` : `/venues/${event.venue.id}`}>Explore the venue<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>}
        </section>
      </div>
      <aside className="order-2 rounded-2xl border border-border/70 bg-background p-6 shadow-sm lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1" aria-label="Event booking">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Your next experience</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight">{Number(event.fee) > 0 ? `${event.fee} ${event.currency || 'SEK'}` : paid ? 'Tickets available' : 'Free'}</p>
        <p className="mt-1 text-sm text-muted-foreground">{paid ? 'Per person' : 'No booking fee'}</p>
        <dl className="my-6 space-y-5 border-y border-border/70 py-6"><div className="flex gap-3"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><div><dt className="text-sm font-medium">Date and time</dt><dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{dateLabel}</dd></div></div><div className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><div><dt className="text-sm font-medium">Location</dt><dd className="mt-1 break-words text-sm leading-relaxed text-muted-foreground">{locationText}</dd></div></div></dl>
        {canManage ? <Link to={`/profile/events/${event.id}/edit`} className={primary}>Edit event<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link> : closed ? <p className="rounded-xl bg-secondary/60 p-4 text-sm">{event.status === 'Cancelled' ? 'This event has been cancelled.' : 'Registration is closed for this event.'}</p> : participates ? <div className="rounded-xl bg-primary/5 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-primary">{registrationStatus === 'Declined' ? <X className="h-4 w-4" aria-hidden="true" /> : registrationStatus === 'Pending' ? <Clock3 className="h-4 w-4" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}{registrationStatus === 'Declined' ? 'Registration declined' : registrationStatus === 'Pending' ? 'Registration requested' : 'You’re on the guest list'}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{registrationStatus === 'Declined' ? 'The organizer could not accept your registration request.' : registrationStatus === 'Pending' ? 'The organizer will review your request and let you know.' : 'Your event details are saved in My Events.'}</p></div> : paid ? <Link to={`/events/${event.id}/tickets`} className={primary}>Choose tickets<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link> : <button type="button" onClick={onRegister} className={primary}>Register for this event<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>}
        {canWithdraw && !canManage && <button type="button" onClick={onWithdraw} className="mt-3 min-h-11 w-full text-sm text-muted-foreground underline underline-offset-4 hover:text-destructive">Withdraw registration</button>}
      </aside>
    </div>
  </div>;
}
