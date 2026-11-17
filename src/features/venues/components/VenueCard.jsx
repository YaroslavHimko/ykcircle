import { Link as RouterLink } from 'react-router-dom';
import { MapPin, Users } from 'lucide-react';
import DiscoveryCard from '@/shared/components/DiscoveryCard.jsx';
import { Skeleton } from '@/shared/components/ui/skeleton.jsx';
import { mediaRenderDebug } from '@/shared/media/media.js';
import {
  venueId,
  humanize,
  publicLocation,
  priceLabel,
  capacityLabel,
  imageUrl,
} from '../model/venue-marketplace.js';
export function VenueCard({ venue, compact = false, owned = false }) {
  const photo = imageUrl(venue);
  if (photo)
    mediaRenderDebug({
      component: 'VenueCard',
      venueId: venueId(venue),
      rawUrl: photo,
    });
  const amenities = (venue.amenities || []).slice(0, 3);
  const destination = venue.slug || venueId(venue);
  return (
    <DiscoveryCard
      href={destination ? `/venues/slug/${destination}` : '/venues'}
      image={photo}
      icon={MapPin}
      badge={priceLabel(venue)}
      eyebrow={`${venue.venueTypeName || humanize(venue.venueType || 'Venue')}${venue.sponsored ? ' · Sponsored' : ''}`}
      title={venue.name}
      footer={
        owned && (
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs text-muted-foreground">
              {humanize(venue.moderationStatus || 'draft')}
            </span>
            <RouterLink
              to={`/profile/venues/${venue.id}/edit`}
              className="inline-flex min-h-10 items-center text-sm text-primary underline"
            >
              Edit venue
            </RouterLink>
            <RouterLink
              to={`/profile/venues/${venue.id}/bookings`}
              className="inline-flex min-h-10 items-center text-sm text-primary underline"
            >
              Bookings
            </RouterLink>
          </div>
        )
      }
    >
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p className="flex items-start gap-2">
          <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="line-clamp-2">{publicLocation(venue)}</span>
        </p>
        <p className="flex items-center gap-2">
          <Users aria-hidden="true" className="h-4 w-4 shrink-0" />
          {capacityLabel(venue)}
        </p>
      </div>
      {!compact && (venue.shortDescription || venue.description) && (
        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {venue.shortDescription || venue.description}
        </p>
      )}
      {!compact && amenities.length > 0 && (
        <p className="mt-auto line-clamp-1 pt-4 text-xs text-muted-foreground">
          {amenities.map((item) => item.name || humanize(item.slug || item)).join(' · ')}
        </p>
      )}
    </DiscoveryCard>
  );
}
export function VenueCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 p-5">
      <Skeleton className="-mx-5 -mt-5 h-48 rounded-none" />
      <Skeleton className="mt-5 h-7 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/2" />
      <Skeleton className="mt-6 h-5 w-1/3" />
    </div>
  );
}
