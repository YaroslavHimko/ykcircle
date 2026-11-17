import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { money, user, when, request } from '../api/tickets.js';
import { Shell, ErrorNotice, TestNotice } from '../components/TicketShell.jsx';
import { TicketQr } from '../components/TicketQr.jsx';
import { TicketBrand } from '../components/TicketBrand.jsx';
import { PrintableTickets } from '../components/PrintableTickets.jsx';
export function TicketOrderPage() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState(false);
  const load = useCallback(
    async (confirm = false) => {
      const data = await request(
        '/api/ticket-orders/' + id + (confirm ? '/confirm' : ''),
        confirm
          ? {
              method: 'POST',
            }
          : {},
      );
      setOrder(data);
      return data;
    },
    [id],
  );
  useEffect(() => {
    let active = true;
    let timer;
    let polls = 0;
    const refresh = async () => {
      try {
        const data = await request('/api/ticket-orders/' + id);
        if (!active) return;
        setOrder(data);
        if (
          data.paymentStatus === 'pending' &&
          Number(data.attendeeUserId) === Number(user()?.id)
        ) {
          const confirmed = await request('/api/ticket-orders/' + id + '/confirm', {
            method: 'POST',
          });
          if (!active) return;
          setOrder(confirmed);
          if (confirmed.paymentStatus === 'pending' && ++polls < 12)
            timer = setTimeout(refresh, 10000);
        } else if (data.emailStatus === 'pending' && data.paymentStatus === 'paid' && ++polls < 12)
          timer = setTimeout(refresh, 10000);
        try {
          sessionStorage.removeItem('ticket-checkout-' + data.eventId);
        } catch {
          /* storage is optional */
        }
      } catch (error) {
        if (active) setError(error.message);
      }
    };
    void refresh();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [id]);
  const action = async (type) => {
    setWorking(true);
    setError('');
    setNotice('');
    try {
      if (type === 'confirm') await load(true);
      else {
        const result = await request('/api/ticket-orders/' + id + '/' + type, {
          method: 'POST',
        });
        if (result.checkoutUrl) return window.location.assign(result.checkoutUrl);
        setNotice(result.message || '');
        await load();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setWorking(false);
    }
  };
  const paid = order?.paymentStatus === 'paid';
  const buyer = Number(order?.attendeeUserId) === Number(user()?.id);
  return (
    <Shell title={paid ? 'Your tickets' : 'Ticket order'}>
      <Link to="/account/tickets" className="mt-4 inline-block text-sm text-primary underline">
        My tickets
      </Link>
      <ErrorNotice message={error} />
      {notice && (
        <p role="status" className="mt-4 text-primary">
          {notice}
        </p>
      )}
      {!order && !error && <p className="mt-8">Loading order…</p>}
      {order && (
        <>
          {order.testMode && <TestNotice />}
          <article className="rounded-2xl mt-6 border border-border p-5">
            <div className="mb-6 border-b border-border pb-5">
              <TicketBrand order={order} />
            </div>
            <h2 className="font-display text-2xl font-semibold">{order.eventTitle}</h2>
            <p className="mt-2">{when(order.event?.startsAt, order.event?.timezone)}</p>
            <p>{order.event?.location}</p>
            <p className="mt-3 text-sm">
              Order {order.orderNumber} · {money(order.totalAmount, order.currency)} ·{' '}
              <span className="capitalize">{order.paymentStatus}</span>
            </p>
            {paid ? (
              <p role="status" className="mt-5 text-primary">
                Payment confirmed.{' '}
                {order.emailStatus === 'sent'
                  ? 'Tickets were sent to '
                  : 'Tickets are queued for delivery to '}
                {order.attendeeEmail}.
              </p>
            ) : order.paymentStatus === 'pending' ? (
              <p role="status" className="mt-5">
                {location.search.includes('cancelled')
                  ? 'Checkout was not completed. Resume payment or cancel this order to release your tickets.'
                  : 'Waiting for Stripe to confirm payment. Tickets are issued only after confirmation.'}
              </p>
            ) : (
              <p className="mt-5">
                This order is {order.paymentStatus.replaceAll('_', ' ')}. Its tickets are not valid
                for admission.
              </p>
            )}
            <div className="mt-5 space-y-3">
              {order.tickets?.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-2xl grid gap-4 border border-dashed border-border p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <h3 className="font-semibold">{ticket.name}</h3>
                    <p className="mt-2 break-all font-mono text-sm">{ticket.code}</p>
                    <p className="mt-2 text-xs">
                      {ticket.checkedInAt
                        ? 'Already checked in.'
                        : ticket.valid
                          ? 'One admission — show this ticket at the event.'
                          : 'Not valid for admission.'}
                    </p>
                  </div>
                  <TicketQr ticket={ticket} />
                </div>
              ))}
            </div>
            {!order.tickets?.length &&
              order.items?.map((item) => (
                <p key={item.id} className="mt-3">
                  {item.ticketType?.name} × {item.quantity}
                </p>
              ))}
            {buyer && (
              <div className="mt-6 flex flex-wrap gap-3 print:hidden">
                {paid ? (
                  <>
                    <button
                      onClick={() => window.print()}
                      className="ui-action border border-border px-4 py-2 text-sm"
                    >
                      Print tickets
                    </button>
                    <button
                      disabled={working}
                      onClick={() => action('resend')}
                      className="ui-action border border-border px-4 py-2 text-sm disabled:opacity-60"
                    >
                      Resend email
                    </button>
                  </>
                ) : (
                  order.paymentStatus === 'pending' && (
                    <>
                      <button
                        disabled={working}
                        onClick={() => action('confirm')}
                        className="ui-action border border-border px-4 py-2 text-sm"
                      >
                        Refresh payment status
                      </button>
                      <button
                        disabled={working}
                        onClick={() => action('checkout')}
                        className="ui-action bg-primary px-4 py-2 text-sm text-primary-foreground"
                      >
                        Resume payment
                      </button>
                      <button
                        disabled={working}
                        onClick={() => action('cancel')}
                        className="ui-action border border-border px-4 py-2 text-sm"
                      >
                        Cancel unpaid order
                      </button>
                    </>
                  )
                )}
              </div>
            )}
            <p className="mt-5 text-xs text-muted-foreground">Ticketing via YKCircle</p>
            <p className="mt-5 text-sm text-muted-foreground">Seller: {order.seller?.legalName}</p>
            {order.refundPolicy?.text && (
              <p className="mt-2 text-sm text-muted-foreground">
                Refund policy: {order.refundPolicy.text}
              </p>
            )}
          </article>
          {paid && order.tickets?.length > 0 && <PrintableTickets order={order} />}
          <Link
            to={'/events/' + order.eventId}
            className="mt-5 inline-block text-sm text-primary underline"
          >
            Back to event
          </Link>
        </>
      )}
    </Shell>
  );
}
