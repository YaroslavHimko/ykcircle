import { when } from '../api/tickets.js';
import { TicketQr } from './TicketQr.jsx';
import { TicketBrand } from './TicketBrand.jsx';
export function PrintableTickets({ order }) {
  return (
    <section className="ticket-print-root" aria-label="Printable tickets">
      {order.tickets?.map((ticket) => (
        <article key={ticket.id} className="ticket-print-card">
          <header className="ticket-print-header">
            <TicketBrand order={order} />
            {order.testMode && <span className="ticket-print-test">Test ticket</span>}
          </header>
          <div className="ticket-print-body">
            <div className="ticket-print-details">
              <p className="ticket-print-type">{ticket.name}</p>
              <h1>{order.eventTitle}</h1>
              <dl>
                <div>
                  <dt>Date and time</dt>
                  <dd>{when(order.event?.startsAt, order.event?.timezone)}</dd>
                </div>
                {order.event?.location && (
                  <div>
                    <dt>Location</dt>
                    <dd>{order.event.location}</dd>
                  </div>
                )}
                <div>
                  <dt>Attendee</dt>
                  <dd>{order.attendeeEmail}</dd>
                </div>
                <div>
                  <dt>Order</dt>
                  <dd>{order.orderNumber}</dd>
                </div>
                {order.seller?.legalName && (
                  <div>
                    <dt>Seller</dt>
                    <dd>{order.seller.legalName}</dd>
                  </div>
                )}
              </dl>
            </div>
            <TicketQr ticket={ticket} size={184} />
          </div>
          <footer className="ticket-print-footer">
            <div>
              <p>Ticket code</p>
              <strong>{ticket.code}</strong>
            </div>
            <p>
              {ticket.checkedInAt
                ? 'Already checked in'
                : ticket.valid
                  ? 'Valid for one admission'
                  : 'Not valid for admission'}
            </p>
          </footer>
          <p className="ticket-platform-credit">Ticketing via YKCircle</p>
        </article>
      ))}
    </section>
  );
}
