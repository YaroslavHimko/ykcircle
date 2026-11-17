import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { money, user, request } from '../api/tickets.js';
import { Shell, ErrorNotice, TestNotice } from '../components/TicketShell.jsx';
export function TicketCheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [context, setContext] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [state, setState] = useState({
    loading: true,
    error: '',
    paying: false,
  });
  const attempt = useRef(null);
  useEffect(() => {
    let active = true;
    setState({
      loading: true,
      error: '',
      paying: false,
    });
    request('/api/events/' + id + '/ticket-checkout')
      .then((data) => {
        if (active) {
          setContext(data);
          setQuantities({});
        }
      })
      .catch((error) => {
        if (active)
          setState((current) => ({
            ...current,
            error: error.message,
          }));
      })
      .finally(() => {
        if (active)
          setState((current) => ({
            ...current,
            loading: false,
          }));
      });
    return () => {
      active = false;
    };
  }, [id]);
  const items = Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([ticketTypeId, quantity]) => ({
      ticketTypeId: Number(ticketTypeId),
      quantity,
    }));
  const total =
    (context?.tickets || []).reduce(
      (sum, ticket) => sum + Math.round(Number(ticket.price) * 100) * (quantities[ticket.id] || 0),
      0,
    ) / 100;
  const buy = async () => {
    if (!localStorage.getItem('authToken'))
      return navigate('/login?from=' + encodeURIComponent(window.location.pathname));
    if (!items.length || state.paying) return;
    setState((current) => ({
      ...current,
      paying: true,
      error: '',
    }));
    const selection = JSON.stringify(items);
    const key = 'ticket-checkout-' + id;
    try {
      // Keep an attempt stable across network retries and page refreshes.
      let saved;
      try {
        saved = JSON.parse(sessionStorage.getItem(key) || 'null');
      } catch {
        /* storage is optional */
      }
      if (!attempt.current && saved?.selection === selection) attempt.current = saved;
      if (attempt.current?.selection !== selection)
        attempt.current = {
          selection,
          checkoutKey: crypto.randomUUID(),
        };
      try {
        sessionStorage.setItem(key, JSON.stringify(attempt.current));
      } catch {
        /* storage is optional */
      }
      const checkout = await request('/api/events/' + id + '/ticket-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          checkoutKey: attempt.current.checkoutKey,
        }),
      });
      window.location.assign(checkout.checkoutUrl);
    } catch (error) {
      setState((current) => ({
        ...current,
        paying: false,
        error: error.message,
      }));
    }
  };
  if (state.loading)
    return (
      <Shell title="Tickets">
        <p className="mt-8">Loading tickets…</p>
      </Shell>
    );
  if (!context)
    return (
      <Shell title="Tickets">
        <ErrorNotice message={state.error} />
        <Link to={'/events/' + id} className="mt-5 inline-block text-primary underline">
          Back to event
        </Link>
      </Shell>
    );
  return (
    <Shell title={'Tickets for ' + context.title}>
      {context.testMode && <TestNotice checkout />}
      <p className="mt-5 text-muted-foreground">
        Sold by {context.seller?.legalName}. Pay securely with Stripe and receive one ticket code
        per admission by email.
      </p>
      {user()?.email && (
        <p className="mt-2 text-sm">
          Delivery email: <strong>{user().email}</strong>
        </p>
      )}
      <ErrorNotice message={state.error} />
      <div className="mt-7 space-y-3">
        {context.tickets.map((ticket) => {
          const maximum =
            ticket.quantityAvailable == null
              ? 20
              : Math.min(
                  20,
                  Math.max(
                    0,
                    Number(ticket.quantityAvailable) -
                      Number(ticket.quantitySold) -
                      Number(ticket.quantityReserved || 0),
                  ),
                );
          return (
            <article
              key={ticket.id}
              className="rounded-2xl grid gap-3 border border-border p-5 sm:grid-cols-[1fr_auto_auto] sm:items-center"
            >
              <div>
                <h2 className="font-display text-xl font-semibold">{ticket.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{ticket.description}</p>
                {!maximum && <p className="text-sm text-destructive">Sold out</p>}
              </div>
              <p>{money(ticket.price, ticket.currency)}</p>
              <label className="text-sm">
                Quantity for {ticket.name}
                <select
                  disabled={state.paying || !maximum}
                  value={quantities[ticket.id] || 0}
                  onChange={(event) =>
                    setQuantities((current) => ({
                      ...current,
                      [ticket.id]: Number(event.target.value),
                    }))
                  }
                  className="ml-2 min-h-11 border border-border bg-background px-3"
                >
                  {Array.from(
                    {
                      length: maximum + 1,
                    },
                    (_, quantity) => (
                      <option key={quantity} value={quantity}>
                        {quantity}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </article>
          );
        })}
        {!context.tickets.length && <p>No tickets are on sale yet.</p>}
      </div>
      {context.refundPolicy?.text && (
        <p className="mt-5 text-sm text-muted-foreground">
          Refund policy: {context.refundPolicy.text}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
        <p className="font-display text-2xl">Total: {money(total, context.currency)}</p>
        <button
          disabled={state.paying || total <= 0}
          onClick={buy}
          className="ui-action bg-primary px-5 py-3 text-sm text-primary-foreground disabled:opacity-60"
        >
          {state.paying
            ? 'Opening Stripe…'
            : context.testMode
              ? 'Continue to test payment'
              : 'Continue to payment'}
        </button>
      </div>
      <div className="mt-5 flex gap-5 text-sm">
        <Link to={'/events/' + id} className="text-primary underline">
          Back to event
        </Link>
        <Link to="/account/tickets" className="text-primary underline">
          My tickets and unpaid orders
        </Link>
      </div>
    </Shell>
  );
}
