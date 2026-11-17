import PageHeader from '@/shared/components/PageHeader.jsx';
import { useProductConfiguration } from '@/shared/hooks/useProductConfiguration.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import VenueBookingConversation from '../components/VenueBookingConversation.jsx';
import { apiFetch } from '@/shared/api/client.js';
import { list, auth, errorText, bookingStart } from '../model/venue-management.js';
import { ExternalInvoiceEditor } from '../components/ExternalInvoiceEditor.jsx';
import { Shell, Loading, Error, Status } from '../components/VenueManagementShell.jsx';
export function VenueBookingsPage() {
  const product = useProductConfiguration();
  const { id } = useParams();
  const [bookings, setBookings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [ownerNote, setOwnerNote] = useState('');
  const [billingSetupBlocked, setBillingSetupBlocked] = useState(false);
  const [notification, setNotification] = useState('');
  const loadVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    setError('');
    try {
      if (!id) throw new Error('This venue is missing its ID.');
      const [bookingsResponse, inquiriesResponse] = await Promise.all([
        apiFetch(`/api/venues/${id}/bookings`, {
          headers: auth(),
        }),
        apiFetch(`/api/venues/${id}/inquiries`, {
          headers: auth(),
        }),
      ]);
      const [bookingsData, inquiriesData] = await Promise.all([
        bookingsResponse.json(),
        inquiriesResponse.json(),
      ]);
      if (version !== loadVersion.current) return;
      if (!bookingsResponse.ok)
        throw new Error(errorText(bookingsData, 'Unable to load event bookings.'));
      if (!inquiriesResponse.ok)
        throw new Error(errorText(inquiriesData, 'Unable to load venue inquiries.'));
      setBookings(list(bookingsData, 'bookings'));
      setInquiries(list(inquiriesData, 'inquiries'));
    } catch (requestError) {
      if (version === loadVersion.current) setError(requestError.message);
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);
  const openReview = (booking, status) => {
    setOwnerNote(booking.ownerNote || '');
    setBillingSetupBlocked(false);
    setNotification('');
    setReviewing({
      booking,
      status,
    });
  };
  const review = async (event) => {
    event.preventDefault();
    if (!reviewing) return;
    const { booking, status } = reviewing;
    try {
      const response = await apiFetch(`/api/venue-bookings/${booking.id}`, {
        method: 'PATCH',
        headers: {
          ...auth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          ownerNote,
        }),
      });
      const data = await response.json();
      if (!response.ok && data?.code === 'FINANCIAL_SETUP_INCOMPLETE') {
        setReviewing(null);
        setBillingSetupBlocked(true);
        const missing =
          Array.isArray(data.missing) && data.missing.length
            ? ` Missing: ${data.missing.join(', ')}.`
            : '';
        setNotification(
          `${data.error || 'Complete the Venue payment setup before approving this paid booking.'}${missing}`,
        );
        return;
      }
      if (!response.ok) throw new Error(errorText(data, 'Unable to update booking.'));
      setReviewing(null);
      if (data.warning)
        setNotification(
          'Booking approved, but invoice document generation failed. Open the invoice to retry the protected PDF.',
        );
      load();
    } catch (requestError) {
      setNotification(requestError.message);
    }
  };
  return (
    <Shell title="Venue requests">
      <PageHeader
        eyebrow="Venue workspace"
        title={<>Venue requests</>}
        description={
          <>
            Direct venue inquiries and event bookings are separate request types. Both are shown
            below.
          </>
        }
      />
      <div className="mt-6 flex flex-wrap items-center gap-4">
        {' '}
        <Link to="/profile/venues" className="text-sm text-primary underline">
          Back to my venues
        </Link>
        {product.paidVenuesEnabled && (
          <Link
            to={`/account/payments/venues?venueId=${id}&edit=1&returnTo=${encodeURIComponent(window.location.pathname)}`}
            className="ml-4 text-sm text-primary underline"
          >
            Venue payments
          </Link>
        )}
      </div>
      {error && <Error text={error} />}
      {loading ? (
        <Loading label="Loading booking requests…" />
      ) : (
        <div className="mt-8 space-y-3">
          <section className="border-b border-border pb-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold">Venue inquiries</h2>
              <p className="text-sm text-muted-foreground">
                {inquiries.length} request{inquiries.length === 1 ? '' : 's'}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Requests sent through the “Request venue” form.
            </p>
            <div className="mt-5 space-y-3">
              {inquiries.map((inquiry) => (
                <article key={inquiry.id} className="rounded-2xl border border-border p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">
                        {inquiry.eventName || inquiry.title || 'Venue inquiry'}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {inquiry.requestedDate
                          ? new Date(inquiry.requestedDate).toLocaleDateString()
                          : 'Date not supplied'}
                        {inquiry.startTime && ` · ${inquiry.startTime}`}
                        {inquiry.endTime && `–${inquiry.endTime}`}
                      </p>
                      {(inquiry.expectedGuests || inquiry.budget) && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {inquiry.expectedGuests ? `${inquiry.expectedGuests} guests` : ''}
                          {inquiry.expectedGuests && inquiry.budget ? ' · ' : ''}
                          {inquiry.budget ? `Budget: ${inquiry.budget} SEK` : ''}
                        </p>
                      )}
                      <p className="mt-3 text-sm">
                        From{' '}
                        {inquiry.requesterName ||
                          inquiry.user?.name ||
                          inquiry.contactName ||
                          'Guest'}
                        {(inquiry.requesterEmail || inquiry.user?.email || inquiry.email) &&
                          ` · ${inquiry.requesterEmail || inquiry.user?.email || inquiry.email}`}
                      </p>
                      {inquiry.message && (
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
                          {inquiry.message}
                        </p>
                      )}
                    </div>
                    <Status status={inquiry.status || 'new'} />
                  </div>
                </article>
              ))}
              {!inquiries.length && (
                <p className="text-sm text-muted-foreground">No venue inquiries yet.</p>
              )}
            </div>
          </section>
          <section className="pt-2">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold">Event bookings</h2>
              <p className="text-sm text-muted-foreground">
                {bookings.length} booking{bookings.length === 1 ? '' : 's'}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Bookings created from an event’s venue-booking flow.
            </p>
            <div className="mt-5 space-y-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-border p-5">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {booking.event?.title || booking.eventTitle || 'Event booking'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {bookingStart(booking)
                          ? new Date(bookingStart(booking)).toLocaleString()
                          : 'Date not supplied'}
                      </p>
                      {booking.organizerEmail && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Organizer: {booking.organizerName || 'Event organizer'} ·{' '}
                          {booking.organizerEmail}
                        </p>
                      )}
                      {booking.ownerNote && (
                        <p className="mt-2 text-sm">Note: {booking.ownerNote}</p>
                      )}
                      <p className="mt-2 text-sm">
                        Calculated price:{' '}
                        <strong>
                          {Number(booking.totalAmount || 0).toLocaleString('sv-SE')}{' '}
                          {booking.currency || 'SEK'}
                        </strong>
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Buyer: {booking.buyerLegalName || 'Not selected'} · Payment:{' '}
                        {booking.invoiceStatus ||
                          booking.externalInvoiceStatus ||
                          booking.paymentStatus ||
                          'not required'}
                      </p>
                    </div>
                    <Status status={booking.status} />
                  </div>
                  {['requested', 'pending'].includes(booking.status) && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => openReview(booking, 'confirmed')}
                        className="ui-action bg-primary px-4 py-2 text-sm text-primary-foreground"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => openReview(booking, 'declined')}
                        className="ui-action border border-border px-4 py-2 text-sm"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {product.paidVenuesEnabled && booking.invoiceId && (
                    <Link
                      to={`/invoices/${booking.invoiceId}`}
                      className="mt-4 inline-block text-sm text-primary underline"
                    >
                      View invoice {booking.invoiceNumber}
                    </Link>
                  )}
                  {product.paidVenuesEnabled &&
                    booking.invoiceMode === 'external' &&
                    booking.status === 'confirmed' && (
                      <ExternalInvoiceEditor
                        booking={booking}
                        onSaved={load}
                        onError={setNotification}
                      />
                    )}
                  <VenueBookingConversation bookingId={booking.id} />
                </div>
              ))}
              {!bookings.length && (
                <p className="text-sm text-muted-foreground">No event bookings yet.</p>
              )}
            </div>
          </section>
        </div>
      )}
      {reviewing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="venue-booking-review-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"
        >
          <form
            onSubmit={review}
            className="rounded-2xl w-full max-w-lg border border-border bg-background p-6 shadow-xl"
          >
            <h2 id="venue-booking-review-title" className="font-display text-2xl font-semibold">
              {reviewing.status === 'confirmed' ? 'Confirm venue booking' : 'Decline venue booking'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {reviewing.booking.eventTitle || 'This event'} will be{' '}
              {reviewing.status === 'confirmed'
                ? reviewing.booking.invoiceMode === 'external'
                  ? 'approved; you will issue the invoice separately'
                  : 'approved and invoiced in your organization’s name'
                : 'declined'}
              .
            </p>
            <label className="mt-5 block text-sm font-medium">
              Optional note to event owner
              <textarea
                autoFocus
                value={ownerNote}
                onChange={(event) => setOwnerNote(event.target.value)}
                maxLength="5000"
                className="mt-2 min-h-28 w-full border border-border bg-background p-3"
              />
            </label>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewing(null)}
                className="ui-action border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                className={
                  reviewing.status === 'confirmed'
                    ? 'bg-primary px-4 py-2 text-sm text-primary-foreground'
                    : 'border border-destructive px-4 py-2 text-sm text-destructive'
                }
              >
                {reviewing.status === 'confirmed' ? 'Confirm booking' : 'Decline booking'}
              </button>
            </div>
          </form>
        </div>
      )}
      {notification && (
        <p
          role="alert"
          className="fixed bottom-6 left-5 z-[60] max-w-md border border-destructive/30 bg-background px-4 py-3 text-sm text-destructive shadow-lg sm:left-auto sm:right-6"
        >
          {notification}
          {billingSetupBlocked && (
            <>
              {' '}
              {product.paidVenuesEnabled && (
                <Link
                  to={`/account/payments/venues?venueId=${id}&edit=1&returnTo=${encodeURIComponent(window.location.pathname)}`}
                  className="font-medium underline"
                >
                  Complete Venue payment setup
                </Link>
              )}
            </>
          )}
        </p>
      )}
    </Shell>
  );
}
