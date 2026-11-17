import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { money, request } from '../api/tickets.js';
import { Shell, ErrorNotice } from '../components/TicketShell.jsx';
export function TicketsPage({ success = false }) {
  const location = useLocation();
  const eventId = new URLSearchParams(location.search).get('eventId');
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const rows = await request('/api/me/tickets');
        if (active) {
          setOrders(Array.isArray(rows) ? rows : rows.orders || []);
          setError('');
        }
      } catch (error) {
        if (active) setError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    if (!localStorage.getItem('authToken')) {
      setError('Sign in to view your tickets.');
      setLoading(false);
      return;
    }
    void load();
    const timer = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  const visibleOrders = eventId
    ? orders.filter((order) => String(order.eventId) === eventId && order.paymentStatus === 'paid')
    : orders;
  return (
    <Shell
      title={eventId ? 'Your event tickets' : 'My tickets'}
      description="View your ticket orders and event admission details."
    >
      {eventId && (
        <Link to="/profile/my-events" className="mt-4 inline-block text-sm text-primary underline">
          Back to My events
        </Link>
      )}
      {success && (
        <p className="mt-5">Open your order to check payment confirmation and view your tickets.</p>
      )}
      <ErrorNotice message={error} />
      {loading ? (
        <p className="mt-8">Loading tickets…</p>
      ) : (
        <div className="mt-7 space-y-3">
          {visibleOrders.map((order) => (
            <Link
              key={order.id}
              to={'/tickets/' + order.id}
              className="ui-action block border border-border p-5 hover:border-primary"
            >
              <div className="flex justify-between gap-3">
                <span>{order.orderNumber}</span>
                <span className="capitalize">{order.paymentStatus}</span>
              </div>
              <p className="mt-2 text-sm">{money(order.totalAmount, order.currency)}</p>
            </Link>
          ))}
          {!visibleOrders.length && (
            <p>{eventId ? 'No issued ticket orders for this event.' : 'No ticket orders yet.'}</p>
          )}
        </div>
      )}
    </Shell>
  );
}
