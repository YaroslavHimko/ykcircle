import PageHeader from '@/shared/components/PageHeader.jsx';
import { useProductConfiguration } from '@/shared/hooks/useProductConfiguration.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { priceLabel as venuePriceLabel } from '../model/venue-marketplace.js';
import { apiFetch } from '@/shared/api/client.js';
import { venueMediaUrl } from '@/shared/media/media.js';
import { isVenueActive, list, normalizeVenue, auth, errorText } from '../model/venue-management.js';
import {
  Shell,
  Loading,
  Error,
  Status,
  ModerationStatus,
} from '../components/VenueManagementShell.jsx';
export function MyVenuesPage() {
  const product = useProductConfiguration();
  const user = JSON.parse(localStorage.getItem('authUser') || 'null');
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const endpoint = '/api/venues/mine';
  const dashboardTitle = 'My venues';
  const [venues, setVenues] = useState([]);
  const [error, setError] = useState('');
  const [emptyMessage, setEmptyMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const loadVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    setError('');
    try {
      const r = await apiFetch(endpoint, {
        headers: auth(),
      });
      const d = await r.json();
      if (version !== loadVersion.current) return;
      if (r.status === 404) {
        setVenues([]);
        setEmptyMessage(errorText(d, 'No venues found.'));
        return;
      }
      if (!r.ok) throw new Error(errorText(d, 'Unable to load venues.'));
      setVenues(
        list(d, 'venues')
          .map(normalizeVenue)
          .filter((venue) => venue.id != null),
      );
      setEmptyMessage('');
    } catch (e) {
      if (version === loadVersion.current) setError(e.message);
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [endpoint]);
  useEffect(() => {
    load();
  }, [load]);
  const remove = async (id) => {
    if (!window.confirm('Delete this venue?')) return;
    try {
      const r = await apiFetch(`/api/venues/${id}`, {
        method: 'DELETE',
        headers: auth(),
      });
      const d = r.status === 204 ? null : await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(errorText(d, 'Unable to delete venue.'));
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const toggleActive = async (venue) => {
    try {
      setError('');
      if (venue?.id == null) throw new Error('This venue is missing its ID and cannot be updated.');
      const r = await apiFetch(`/api/venues/${venue.id}`, {
        method: 'PATCH',
        headers: {
          ...auth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !isVenueActive(venue.isActive),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(errorText(d, 'Unable to update venue state.'));
      const updated = normalizeVenue(d.venue || d);
      setVenues((current) =>
        current.map((item) =>
          item.id === venue.id
            ? {
                ...item,
                ...updated,
                isActive: isVenueActive(updated.isActive),
              }
            : item,
        ),
      );
    } catch (e) {
      setError(e.message);
    }
  };
  const publish = async (venue) => {
    try {
      setError('');
      if (venue?.id == null)
        throw new Error('This venue is missing its ID and cannot be published.');
      const r = await apiFetch(`/api/admin/venues/${venue.id}/moderation`, {
        method: 'PATCH',
        headers: {
          ...auth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moderationStatus: 'approved',
        }),
      });
      const d = r.status === 204 ? null : await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(errorText(d, 'Unable to publish venue.'));
      const updated = normalizeVenue(d.venue || d);
      setVenues((current) =>
        current.map((item) =>
          item.id === venue.id
            ? {
                ...item,
                ...updated,
                isActive: isVenueActive(updated.isActive),
              }
            : item,
        ),
      );
    } catch (e) {
      setError(e.message);
    }
  };
  const submitForReview = async (venue) => {
    try {
      setError('');
      if (venue?.id == null)
        throw new Error('This venue is missing its ID and cannot be submitted for review.');
      const r = await apiFetch(`/api/venues/${venue.id}/submit-for-review`, {
        method: 'POST',
        headers: auth(),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(errorText(d, 'Unable to submit venue for review.'));
      const updated = normalizeVenue(d.venue || d);
      setVenues((current) =>
        current.map((item) =>
          item.id === venue.id
            ? {
                ...item,
                ...updated,
                isActive: isVenueActive(updated.isActive),
              }
            : item,
        ),
      );
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <Shell title={dashboardTitle}>
      <div className="space-y-6">
        <div>
          <PageHeader
            eyebrow="Venue workspace"
            title={dashboardTitle}
            description={
              isAdmin || isManager
                ? 'Review all active and inactive venues.'
                : 'Create spaces and respond to event booking requests.'
            }
          />
        </div>
        <Link
          to="/profile/venues/new"
          className="ui-action inline-flex min-h-11 shrink-0 items-center justify-center self-center bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Add venue
        </Link>
      </div>
      {error && <Error text={error} />}
      {loading ? (
        <Loading label="Loading venues…" />
      ) : (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {venues.map((v) => {
              const owner = v.owner || v.user || {};
              const ownerName = owner.name || v.ownerName || v.ownerEmail || 'Not supplied';
              const active = isVenueActive(v.isActive);
              const moderationStatus = v.moderationStatus || 'draft';
              const coverImage = venueMediaUrl(v);
              return (
                <article
                  key={v.id}
                  className="overflow-hidden rounded-xl border border-border/70 transition-shadow hover:shadow-md"
                >
                  <div className="flex h-full flex-col">
                    <div className="relative aspect-[16/10] overflow-hidden bg-secondary/60">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          loading="lazy"
                          alt={`Preview of ${v.name}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full min-h-28 items-end bg-[linear-gradient(135deg,hsl(var(--primary)/.16),hsl(var(--secondary)))] p-4 font-display text-lg text-muted-foreground">
                          Venue
                        </div>
                      )}
                      <span className="absolute right-3 top-3 max-w-[calc(100%-1.5rem)] rounded-full bg-background/95 px-3 py-1.5 text-xs font-medium shadow-sm">
                        {venuePriceLabel(v)}
                      </span>
                    </div>
                    <div className="min-w-0 p-5">
                      <div className="flex justify-between gap-3">
                        <h2 className="font-display text-2xl font-semibold">{v.name}</h2>
                        <div className="flex flex-wrap items-center gap-2">
                          <ModerationStatus status={moderationStatus} />
                          <Status status={active ? 'active' : 'inactive'} />
                        </div>
                      </div>
                      <dl className="mt-4 grid gap-2 text-sm">
                        <div>
                          <dt className="inline text-muted-foreground">Business: </dt>
                          <dd className="inline">{v.businessName || 'Not supplied'}</dd>
                        </div>
                        <div>
                          <dt className="inline text-muted-foreground">Owner: </dt>
                          <dd className="inline">{ownerName}</dd>
                        </div>
                        <div>
                          <dt className="inline text-muted-foreground">Location: </dt>
                          <dd className="inline">
                            {[v.location, v.address, v.city, v.country]
                              .filter(Boolean)
                              .join(', ') || 'Not supplied'}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline text-muted-foreground">Timezone: </dt>
                          <dd className="inline">{v.timezone || 'Not supplied'}</dd>
                        </div>
                      </dl>
                      <div className="mt-5 flex flex-wrap gap-2 text-sm">
                        <Link
                          className="ui-action border border-border px-4 py-2"
                          to={`/venues/${v.id}`}
                        >
                          Venue details
                        </Link>
                        <Link
                          className="ui-action border border-border px-4 py-2"
                          to={`/profile/venues/${v.id}/edit`}
                        >
                          Edit & availability
                        </Link>
                        <Link
                          className="ui-action border border-border px-4 py-2"
                          to={`/profile/venues/${v.id}/bookings`}
                        >
                          Booking list
                        </Link>
                        {product.paidVenuesEnabled && (
                          <Link
                            className="ui-action border border-border px-4 py-2"
                            to={`/account/billing?section=invoices&venueId=${encodeURIComponent(v.id)}`}
                          >
                            Invoices
                          </Link>
                        )}
                        {isAdmin && moderationStatus !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => publish(v)}
                            className="ui-action bg-primary px-4 py-2 text-primary-foreground"
                          >
                            Approve
                          </button>
                        )}
                        {!isAdmin && ['draft', 'rejected'].includes(moderationStatus) && (
                          <button
                            type="button"
                            onClick={() => submitForReview(v)}
                            className="ui-action bg-primary px-4 py-2 text-primary-foreground"
                          >
                            Submit for review
                          </button>
                        )}
                        {!isAdmin && moderationStatus === 'pending' && (
                          <span className="px-4 py-2 text-muted-foreground">Awaiting review</span>
                        )}
                        {(isAdmin || isManager) && (
                          <button
                            type="button"
                            onClick={() => toggleActive(v)}
                            className="ui-action border border-border px-4 py-2"
                          >
                            {active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => remove(v.id)}
                          className="ui-action border border-destructive px-4 py-2 text-destructive"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {!venues.length && !error && (
            <p className="mt-8 text-muted-foreground">{emptyMessage || 'No venues found.'}</p>
          )}
        </>
      )}
    </Shell>
  );
}
