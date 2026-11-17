import { Link } from 'react-router-dom';
import { SelectedBookingTimeGrid } from '@/features/events/components/SelectedBookingTimeGrid.jsx';
import { BusinessIdentitySelector } from '@/features/billing/index.js';
import { VenueBookingTimeSelector } from '@/features/events/components/VenueBookingTimeSelector.jsx';
export function EventVenueBookingPanel({
  venueBooking,
  product,
  persistedBookingTime,
  bookingSchedule,
  billingProfiles,
  buyerBillingProfileId,
  setBuyerBillingProfileId,
  setBillingProfiles,
  bookingSaving,
  updateVenueBookingBuyer,
  cancelVenueBooking,
  selectedVenueId,
  setSelectedVenueId,
  venues,
  bookingTime,
  setBookingTime,
  requestVenueBooking,
}) {
  return (
    <section className="rounded-2xl mt-8 max-w-2xl border border-border p-5">
      <h2 className="font-display text-2xl font-semibold">Venue booking</h2>
      {venueBooking ? (
        <>
          <p className="mt-2 text-sm">
            Status: <span className="capitalize text-primary">{venueBooking.status}</span>
            {venueBooking.ownerNote && ` — ${venueBooking.ownerNote}`}
          </p>
          {product.paidVenuesEnabled && venueBooking.invoiceId && (
            <p className="mt-3 text-sm">
              Invoice:{' '}
              <Link to={`/invoices/${venueBooking.invoiceId}`} className="text-primary underline">
                {venueBooking.invoiceNumber || `#${venueBooking.invoiceId}`}
              </Link>{' '}
              · {venueBooking.invoiceStatus || venueBooking.paymentStatus}
            </p>
          )}
          {product.paidVenuesEnabled && venueBooking.externalInvoiceId && (
            <p className="mt-3 text-sm">
              The Venue manages this invoice externally. Status:{' '}
              {venueBooking.externalInvoiceStatus || venueBooking.paymentStatus}.
              {venueBooking.externalInvoiceUrl && (
                <>
                  {' '}
                  <a
                    href={venueBooking.externalInvoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    Open invoice
                  </a>
                </>
              )}
            </p>
          )}
          {persistedBookingTime && (
            <>
              <p className="mt-4 text-sm font-medium text-primary">Current booking</p>
              <SelectedBookingTimeGrid schedule={bookingSchedule} value={persistedBookingTime} />
            </>
          )}
          {bookingSchedule.loading && (
            <p role="status" className="mt-3 text-sm text-muted-foreground">
              Loading venue availability…
            </p>
          )}
          {bookingSchedule.timezone && (
            <p className="mt-3 text-xs text-muted-foreground">
              Venue time: {bookingSchedule.timezone}
            </p>
          )}
          {venueBooking.status === 'requested' && (
            <div className="mt-4 border-t border-border pt-4">
              <BusinessIdentitySelector
                context="venue_buyer"
                profiles={billingProfiles}
                value={buyerBillingProfileId}
                onChange={setBuyerBillingProfileId}
                onCreated={(saved) =>
                  setBillingProfiles((current) => [
                    ...current.filter((item) => item.id !== saved.id),
                    saved,
                  ])
                }
              />
              <button
                type="button"
                disabled={bookingSaving || !buyerBillingProfileId}
                onClick={updateVenueBookingBuyer}
                className="ui-action mt-3 bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
              >
                {bookingSaving ? 'Saving…' : 'Update booking buyer'}
              </button>
            </div>
          )}
          {['requested', 'pending', 'confirmed'].includes(venueBooking.status) && (
            <button
              type="button"
              disabled={bookingSaving}
              onClick={cancelVenueBooking}
              className="ui-action mt-4 border border-border px-4 py-2 text-sm disabled:opacity-60"
            >
              Cancel booking request
            </button>
          )}
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a venue, then select a bookable start and end time. The request remains subject
            to the backend confirmation check.
          </p>
          <label className="mt-4 block text-sm font-medium">
            Venue
            <select
              value={selectedVenueId}
              onChange={(event) => setSelectedVenueId(event.target.value)}
              className="mt-2 min-h-11 w-full border border-border bg-background px-3"
            >
              <option value="">Choose a venue</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                  {venue.city ? ` — ${venue.city}` : ''}
                </option>
              ))}
            </select>
          </label>
          {selectedVenueId && (
            <VenueBookingTimeSelector
              schedule={bookingSchedule}
              value={bookingTime}
              onChange={setBookingTime}
              billingProfiles={billingProfiles}
              buyerBillingProfileId={buyerBillingProfileId}
              onBuyerBillingProfileChange={setBuyerBillingProfileId}
            />
          )}
          {bookingSchedule.timezone && (
            <p className="mt-3 text-xs text-muted-foreground">
              Venue time: {bookingSchedule.timezone}
            </p>
          )}
          <button
            type="button"
            disabled={bookingSaving || !bookingTime}
            onClick={requestVenueBooking}
            className="ui-action mt-4 bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
          >
            Request booking
          </button>
        </>
      )}
    </section>
  );
}
