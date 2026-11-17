import { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronLeft, Heart, MapPin } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton.jsx';
import { apiFetch } from '@/shared/api/client.js';
import { mediaRenderDebug } from '@/shared/media/media.js';
import MapLocation from '@/shared/components/MapLocation.jsx';
import { Link } from '../components/VenueLink.jsx';
import {
  asList,
  venueId,
  normalizeVenue,
  authHeaders,
  getError,
  humanize,
  publicLocation,
  priceLabel,
  capacityLabel,
  imageUrl,
  galleryImageUrl,
} from '../model/venue-marketplace.js';
import { Shell, ErrorState } from '../components/VenueShell.jsx';
import { VenueCard } from '../components/VenueCard.jsx';
import { ImageLightbox } from '../components/ImageLightbox.jsx';
import { InquiryForm } from '../components/InquiryForm.jsx';
import { TagList, Capacity } from '../components/VenueFacts.jsx';
export function VenueDetailPage({ legacyId = false, managed = false }) {
  const params = useParams();
  const slug = legacyId ? params.id || params.city : params.slug;
  const navigate = useNavigate();
  const DetailLink = ({ to, ...props }) => (
    <RouterLink to={to === '/venues' && managed ? '/profile/venues' : to} {...props} />
  );
  const [state, setState] = useState({
    loading: true,
    error: '',
    venue: null,
    similar: [],
  });
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const load = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: true,
      error: '',
    }));
    try {
      const endpoint = legacyId
        ? `/api/venues/${slug}`
        : `/api/venues/slug/${encodeURIComponent(slug)}`;
      const response = await apiFetch(endpoint);
      const data = await response.json();
      if (!response.ok) throw new Error(getError(data, "We couldn't load this venue. Try again."));
      const venue = normalizeVenue(data.venue || data);
      const id = venueId(venue);
      setSaved(Boolean(venue.isSaved || venue.saved));
      const related =
        id == null
          ? []
          : await apiFetch(`/api/venues/${id}/similar`).then(async (result) =>
              result.ok ? result.json() : [],
            );
      setState({
        loading: false,
        error: '',
        venue,
        similar: (asList(related, 'venues').length
          ? asList(related, 'venues')
          : asList(related, 'similar')
        )
          .map(normalizeVenue)
          .filter((item) => item.id != null),
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error.message,
      }));
    }
  }, [legacyId, slug]);
  useEffect(() => {
    load();
  }, [load]);
  const venue = state.venue;
  // A draft venue's image URL carries a short-lived signed token. If it expires
  // while this page is left open, one silent re-fetch picks up a fresh token
  // without flashing the full loading skeleton.
  const imageRetriedRef = useRef(false);
  const handleImageError = useCallback(async () => {
    if (imageRetriedRef.current) return;
    imageRetriedRef.current = true;
    try {
      const endpoint = legacyId
        ? `/api/venues/${slug}`
        : `/api/venues/slug/${encodeURIComponent(slug)}`;
      const response = await apiFetch(endpoint);
      const data = await response.json();
      if (response.ok)
        setState((current) => ({
          ...current,
          venue: normalizeVenue(data.venue || data),
        }));
    } catch {
      /* Keep showing the previous venue if the silent refresh fails. */
    }
  }, [legacyId, slug]);
  const toggleSaved = async () => {
    if (!localStorage.getItem('authToken'))
      return navigate(`/login?from=${encodeURIComponent(window.location.pathname)}`);
    setSaveError('');
    try {
      const id = venueId(venue);
      if (id == null) throw new Error('This venue is missing its ID and cannot be saved yet.');
      const response = await apiFetch(`/api/venues/${id}/save`, {
        method: saved ? 'DELETE' : 'POST',
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(getError(data, 'Unable to update saved venues.'));
      setSaved((current) => !current);
    } catch (error) {
      setSaveError(error.message);
    }
  };
  // Availability is checked before sending an inquiry so organizers select a
  // backend-provided bookable interval instead of guessing from the listing.
  const request = () => {
    const id = venueId(venue);
    if (id != null) navigate(`/venues/${id}/availability`);
  };
  if (state.loading)
    return (
      <Shell title="Venue">
        <div className="mx-auto max-w-5xl">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="mt-8 h-12 w-1/2" />
          <Skeleton className="mt-4 h-6 w-1/3" />
        </div>
      </Shell>
    );
  if (state.error || !venue)
    return (
      <Shell title="Venue">
        <DetailLink to="/venues" className="text-sm text-primary underline">
          Back to {managed ? 'manage venues' : 'venues'}
        </DetailLink>
        <ErrorState error={state.error || 'Venue not found.'} retry={load} />
      </Shell>
    );
  const photo = imageUrl(venue);
  const galleryImages = (venue.images || [])
    .map((item) => {
      const src = galleryImageUrl(item);
      if (src)
        mediaRenderDebug({
          component: 'VenueDetailGallery',
          venueId: venueId(venue),
          rawUrl: src,
        });
      return {
        src,
        caption: item.caption || '',
      };
    })
    .filter((entry) => entry.src);
  const heroInGallery = galleryImages.some((entry) => entry.src === photo);
  const lightboxImages =
    photo && !heroInGallery
      ? [
          {
            src: photo,
            caption: '',
          },
          ...galleryImages,
        ]
      : galleryImages;
  const galleryOffset = photo && !heroInGallery ? 1 : 0;
  const heroLightboxIndex = photo
    ? Math.max(
        lightboxImages.findIndex((entry) => entry.src === photo),
        0,
      )
    : null;
  const verified = venue.verificationStatus === 'verified' || venue.isVerified;
  if (photo)
    mediaRenderDebug({
      component: 'VenueDetailPage',
      venueId: venueId(venue),
      rawUrl: photo,
    });
  return (
    <Shell
      title={`${venue.name} — ${venue.venueTypeName || 'Venue'}`}
      description={venue.shortDescription || venue.description}
    >
      <DetailLink
        to="/venues"
        className="inline-flex items-center gap-1 text-sm text-primary underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to {managed ? 'manage venues' : 'venues'}
      </DetailLink>
      <article className="mx-auto mt-6 max-w-5xl">
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
          <div className="relative">
            {photo ? (
              <button
                type="button"
                onClick={() => setLightboxIndex(heroLightboxIndex)}
                aria-label={`View photos of ${venue.name}`}
                className="block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              >
                <img
                  src={photo}
                  alt=""
                  className="h-72 w-full object-cover sm:h-[28rem]"
                  onError={handleImageError}
                />
              </button>
            ) : (
              <div className="flex h-64 items-end bg-secondary/60 p-7 font-display text-4xl text-muted-foreground">
                {venue.name}
              </div>
            )}
            <span className="absolute right-4 top-4 max-w-[calc(100%-2rem)] rounded-full bg-background/95 px-4 py-2 text-sm font-medium shadow-sm">
              {priceLabel(venue)}
            </span>
          </div>
          <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div>
              <div className="flex flex-wrap items-start gap-3">
                <h1 className="break-words font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                  {venue.name}
                </h1>
                {verified && (
                  <span className="inline-flex items-center gap-1 border border-primary/40 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    <Check className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}
                {venue.sponsored && (
                  <span className="border border-primary/40 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    Sponsored
                  </span>
                )}
              </div>
              <p className="mt-3 flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {publicLocation(venue)}
              </p>
              <p className="mt-5 text-lg">
                {venue.venueTypeName || humanize(venue.venueType || 'Venue')} ·{' '}
                {capacityLabel(venue)}
              </p>
              <p className="mt-5 text-xl font-semibold text-primary">{priceLabel(venue)}</p>
            </div>
            <aside className="self-start rounded-xl border border-border/70 bg-secondary/20 p-5">
              <button
                type="button"
                onClick={request}
                className="ui-action min-h-12 w-full rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Request venue
              </button>
              <button
                type="button"
                onClick={toggleSaved}
                className="ui-action mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-border px-4 text-sm"
              >
                <Heart className={`h-4 w-4 ${saved ? 'fill-primary text-primary' : ''}`} />
                {saved ? 'Saved' : 'Save venue'}
              </button>
              {venue.contactEmail && (
                <a
                  href={`mailto:${venue.contactEmail}`}
                  className="ui-action mt-3 flex min-h-11 items-center justify-center border border-border px-4 text-sm"
                >
                  Message venue
                </a>
              )}
              {saveError && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {saveError}
                </p>
              )}
            </aside>
          </div>
        </div>
        {galleryImages.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-3xl font-semibold">Gallery</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {galleryImages.slice(0, 20).map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setLightboxIndex(index + galleryOffset)}
                  aria-label={`View venue photo ${index + 1}`}
                  className="aspect-[4/3] cursor-zoom-in overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <img
                    src={item.src}
                    alt={item.caption || ''}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                    onError={handleImageError}
                  />
                </button>
              ))}
            </div>
          </section>
        )}
        <section className="mt-8 grid gap-8 rounded-2xl border border-border/70 bg-background p-6 sm:p-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold">About this venue</h2>
            <p className="mt-4 whitespace-pre-wrap leading-relaxed text-muted-foreground">
              {venue.description ||
                venue.shortDescription ||
                'More details will be shared by the venue.'}
            </p>
            {venue.suitableEventTypes?.length > 0 && (
              <>
                <h3 className="mt-8 font-display text-2xl font-semibold">Suitable for</h3>
                <TagList items={venue.suitableEventTypes} />
              </>
            )}
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold">Capacity</h2>
            <Capacity venue={venue} />
            <h3 className="mt-8 font-display text-2xl font-semibold">Amenities</h3>
            <TagList items={venue.amenities} empty="Amenities are shared on request." />
          </div>
        </section>
        <section className="mt-8 grid gap-8 rounded-2xl border border-border/70 bg-background p-6 sm:p-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold">Pricing</h2>
            <p className="mt-4 text-lg font-medium text-primary">{priceLabel(venue)}</p>
            {venue.pricing?.description || venue.pricingDescription ? (
              <p className="mt-3 whitespace-pre-wrap text-muted-foreground">
                {venue.pricing?.description || venue.pricingDescription}
              </p>
            ) : null}
            {venue.minimumBookingHours ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Minimum booking: {venue.minimumBookingHours} hours
              </p>
            ) : null}
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold">Location</h2>
            <p className="mt-4 text-muted-foreground">{publicLocation(venue)}</p>
            <MapLocation
              location={venue.location || venue}
              label={venue.name}
              hidden={['private', 'private_until_booking'].includes(venue.locationVisibility)}
            />
          </div>
        </section>
        {(venue.houseRulesText || venue.rules?.length) && (
          <section className="mt-8 rounded-2xl border border-border/70 bg-secondary/20 p-6 sm:p-8">
            <h2 className="font-display text-3xl font-semibold">Venue rules</h2>
            {venue.rules?.length ? <TagList items={venue.rules} /> : null}
            {venue.houseRulesText && (
              <p className="mt-4 whitespace-pre-wrap text-muted-foreground">
                {venue.houseRulesText}
              </p>
            )}
          </section>
        )}
        <section className="mt-10 flex flex-wrap justify-between gap-4 border-t border-border pt-8">
          {venueId(venue) != null && (
            <Link
              to={`/report?entityType=venue&entityId=${encodeURIComponent(venueId(venue))}&contentUrl=${encodeURIComponent(window.location.href)}`}
              className="text-sm text-muted-foreground underline"
            >
              Report venue
            </Link>
          )}
          {venue.organization?.name && (
            <p className="text-sm text-muted-foreground">Listed by {venue.organization.name}</p>
          )}
        </section>
        {state.similar.length > 0 && (
          <section className="mt-10 border-t border-border pt-8">
            <h2 className="font-display text-3xl font-semibold">Similar venues</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {state.similar.map((item) => (
                <VenueCard key={item.id} venue={item} compact />
              ))}
            </div>
          </section>
        )}
      </article>
      {inquiryOpen && <InquiryForm venue={venue} onClose={() => setInquiryOpen(false)} />}
      {lightboxIndex != null && (
        <ImageLightbox
          images={lightboxImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
          onImageError={handleImageError}
        />
      )}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <span className="text-sm font-medium text-primary">{priceLabel(venue)}</span>
          <button
            type="button"
            onClick={request}
            className="ui-action bg-primary px-4 py-3 text-sm text-primary-foreground"
          >
            Request venue
          </button>
        </div>
      </div>
    </Shell>
  );
}
