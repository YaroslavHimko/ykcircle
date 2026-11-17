import EventPreviewCard from '@/features/events/components/EventPreviewCard.jsx';
import { Link } from 'react-router-dom';
export function EventDirectoryPanel({
  managementOnly,
  loading,
  attending,
  active,
  canManage,
  archiveEvent,
  deleteEvent,
}) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-3xl font-semibold">
        {managementOnly ? 'Your events' : 'Upcoming experiences'}
      </h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading || (!managementOnly && attending.loading) ? (
          <div className="flex items-center gap-3 py-8 text-muted-foreground">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
              aria-hidden="true"
            />
            Loading events…
          </div>
        ) : active.length === 0 ? (
          <p className="py-6 text-muted-foreground">
            {!managementOnly && attending.events.length
              ? 'Your events are listed above. No other events match this selection.'
              : 'No published events are available yet.'}
          </p>
        ) : (
          active.map((event) => (
            <EventPreviewCard key={event.id} event={event}>
              {event.status !== 'Published' && (
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-primary">
                  {event.status}
                </p>
              )}
              {event.seriesId && (
                <p className="mb-3 text-xs text-muted-foreground">
                  Recurring series · occurrence {event.occurrenceNumber || 1} of{' '}
                  {event.recurrenceCount || '?'}
                </p>
              )}
              {event.groupName && (
                <Link
                  to={`/groups/${event.groupId}${managementOnly ? '?manage=1' : ''}`}
                  className="mb-3 inline-block text-xs font-medium text-primary hover:underline"
                >
                  From {event.groupName}
                </Link>
              )}
              {(event.venueBooking?.status === 'confirmed' ||
                event.venue_booking?.status === 'confirmed') && (
                <p className="mb-3 text-sm text-primary">
                  Confirmed venue:{' '}
                  {event.venueBooking?.venue?.name ||
                    event.venueBooking?.venueName ||
                    event.venue_booking?.venue?.name ||
                    event.venue_booking?.venueName}
                </p>
              )}
              {canManage ? (
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`/profile/events/${event.id}/edit`}
                    className="ui-action inline-flex min-h-10 items-center justify-center border border-border px-3 text-sm"
                  >
                    Edit
                  </a>
                  <a
                    href={`/events/${event.id}?manage=1`}
                    className="ui-action inline-flex min-h-10 items-center justify-center bg-primary px-3 text-sm text-primary-foreground"
                  >
                    Manage
                  </a>
                  {event.status !== 'Completed' && (
                    <button
                      type="button"
                      onClick={() => archiveEvent(event.id)}
                      className="ui-action min-h-10 border border-border px-3 text-sm"
                    >
                      Archive
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteEvent(event.id)}
                    className="ui-action min-h-10 border border-destructive px-3 text-sm text-destructive"
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </EventPreviewCard>
          ))
        )}
      </div>
    </section>
  );
}
