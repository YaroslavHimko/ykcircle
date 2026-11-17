import { BusinessIdentitySelector, PaymentAccounts } from '@/features/billing/index.js';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { EventTicketTypes } from '@/features/tickets/index.js';
import { apiFetch } from '@/shared/api/client.js';
export function PaidEventFinancialConsole({
  eventId,
  token,
  currency,
  billingProfiles,
  onProfileCreated,
}) {
  const sellerRequest = useRef(0);
  const [ticketRevision, setTicketRevision] = useState(0);
  const [settings, setSettings] = useState({
    sellerBillingProfileId: '',
    paymentAccountId: '',
    sellerCapacity: '',
    refundPolicy: {
      text: '',
    },
    paymentsEnabled: false,
    ticketSalesEnabled: false,
  });
  const [accounts, setAccounts] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [ticket, setTicket] = useState({
    name: 'General admission',
    description: '',
    price: '',
    quantityAvailable: '',
  });
  const [state, setState] = useState({
    loading: true,
    saving: false,
    error: '',
    notice: '',
  });
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const load = async () => {
    try {
      const response = await apiFetch(`/api/events/${eventId}/payment-settings`, {
        headers,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load ticket payment setup.');
      const next = {
        ...settings,
        ...data,
        sellerBillingProfileId: data.sellerBillingProfileId || '',
        paymentAccountId: data.paymentAccountId || '',
        sellerCapacity: data.sellerCapacity || '',
        refundPolicy: data.refundPolicy || {
          text: '',
        },
      };
      const draft = sessionStorage.getItem('ticket-event-draft:' + eventId);
      if (draft) {
        try {
          Object.assign(next, JSON.parse(draft));
        } catch {
          sessionStorage.removeItem('ticket-event-draft:' + eventId);
        }
      }
      setSettings(next);
      if (next.sellerBillingProfileId) {
        const accountResponse = await apiFetch(
          `/api/me/billing-profiles/${next.sellerBillingProfileId}/payment-accounts`,
          {
            headers,
          },
        );
        if (accountResponse.ok) {
          const accountData = await accountResponse.json();
          const rows = Array.isArray(accountData) ? accountData : accountData.accounts || [];
          setAccounts(rows);
          if (!next.paymentAccountId)
            setSettings((current) => ({
              ...current,
              paymentAccountId:
                rows.find((item) => item.chargesEnabled && item.onboardingStatus === 'ready')?.id ||
                rows[0]?.id ||
                '',
            }));
        }
      }
      const readinessResponse = await apiFetch(`/api/events/${eventId}/financial-readiness`, {
        headers,
      });
      if (readinessResponse.ok) setReadiness(await readinessResponse.json());
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.message,
      }));
    } finally {
      setState((current) => ({
        ...current,
        loading: false,
      }));
    }
  };
  useEffect(() => {
    load();
  }, [eventId, token]);
  const changeSeller = async (sellerBillingProfileId) => {
    const request = ++sellerRequest.current;
    const changed = String(settings.sellerBillingProfileId) !== String(sellerBillingProfileId);
    if (changed) {
      setAccounts([]);
      setReadiness(null);
    }
    setSettings((current) => ({
      ...current,
      sellerBillingProfileId,
      ...(changed
        ? {
            paymentAccountId: '',
            paymentsEnabled: false,
            ticketSalesEnabled: false,
          }
        : {}),
    }));
    if (!sellerBillingProfileId) return;
    try {
      const response = await apiFetch(
        `/api/me/billing-profiles/${sellerBillingProfileId}/payment-accounts`,
        {
          headers,
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to check ticket payments.');
      if (request !== sellerRequest.current) return;
      const rows = Array.isArray(data) ? data : data.accounts || [];
      setSettings((current) => {
        if (String(current.sellerBillingProfileId) !== String(sellerBillingProfileId))
          return current;
        return {
          ...current,
          paymentAccountId: rows.some(
            (item) => String(item.id) === String(current.paymentAccountId),
          )
            ? current.paymentAccountId
            : rows.find((item) => item.chargesEnabled && item.onboardingStatus === 'ready')?.id ||
              rows[0]?.id ||
              '',
        };
      });
      setAccounts(rows);
    } catch (failure) {
      if (request === sellerRequest.current)
        setState((current) => ({
          ...current,
          error: failure.message,
        }));
    }
  };
  const save = async () => {
    setState((current) => ({
      ...current,
      saving: true,
      error: '',
      notice: '',
    }));
    try {
      const response = await apiFetch(`/api/events/${eventId}/payment-settings`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          currency,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save ticket payment setup.');
      setSettings((current) => ({
        ...current,
        ...data,
        refundPolicy: data.refundPolicy || {
          text: '',
        },
      }));
      setState((current) => ({
        ...current,
        saving: false,
        notice: 'Seller payment settings saved.',
      }));
      sessionStorage.removeItem('ticket-event-draft:' + eventId);
      await load();
    } catch (error) {
      setState((current) => ({
        ...current,
        saving: false,
        error: error.message,
      }));
    }
  };
  const addTicket = async (event) => {
    event.preventDefault();
    setState((current) => ({
      ...current,
      saving: true,
      error: '',
      notice: '',
    }));
    try {
      const response = await apiFetch(`/api/events/${eventId}/ticket-types`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...ticket,
          price: Number(ticket.price),
          quantityAvailable:
            ticket.quantityAvailable === '' ? null : Number(ticket.quantityAvailable),
          currency,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to add ticket type.');
      setTicket({
        name: 'General admission',
        description: '',
        price: '',
        quantityAvailable: '',
      });
      setState((current) => ({
        ...current,
        saving: false,
        notice: 'Ticket type added.',
      }));
      setTicketRevision((current) => current + 1);
    } catch (error) {
      setState((current) => ({
        ...current,
        saving: false,
        error: error.message,
      }));
    }
  };
  return (
    <section className="rounded-2xl mt-5 max-w-2xl border border-border p-5">
      <h2 className="font-display text-2xl font-semibold">Start selling tickets</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose who is selling these tickets, then set up ticket payments. Free Events do not need
        this setup.
      </p>
      <EventTicketTypes eventId={eventId} token={token} revision={ticketRevision} />
      {state.loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Checking ticket payments…</p>
      ) : (
        <>
          <div className="mt-4">
            <BusinessIdentitySelector
              context="ticket_seller"
              profiles={billingProfiles}
              value={settings.sellerBillingProfileId}
              onChange={changeSeller}
              onCreated={onProfileCreated}
            />
          </div>
          {settings.sellerBillingProfileId &&
            billingProfiles.find(
              (item) => String(item.id) === String(settings.sellerBillingProfileId),
            ) && (
              <PaymentAccounts
                profile={billingProfiles.find(
                  (item) => String(item.id) === String(settings.sellerBillingProfileId),
                )}
                returnTo={window.location.pathname + window.location.search}
                beforeConnect={() =>
                  sessionStorage.setItem('ticket-event-draft:' + eventId, JSON.stringify(settings))
                }
                onUpdated={() => changeSeller(settings.sellerBillingProfileId)}
              />
            )}
          {accounts.length > 1 && (
            <label className="mt-4 block text-sm">
              Stripe connection
              <select
                value={settings.paymentAccountId}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    paymentAccountId: event.target.value,
                  }))
                }
                className="mt-2 min-h-11 w-full border border-border bg-background px-3"
              >
                {accounts.map((account, index) => (
                  <option key={account.id} value={account.id}>
                    Stripe {index + 1} ·{' '}
                    {account.chargesEnabled && account.onboardingStatus === 'ready'
                      ? 'Ready'
                      : 'Setup incomplete'}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="mt-4 block text-sm font-medium">
            Seller capacity
            <select
              value={settings.sellerCapacity}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  sellerCapacity: event.target.value,
                }))
              }
              className="mt-2 min-h-11 w-full border border-border bg-background px-3"
            >
              <option value="">Choose capacity</option>
              <option value="trader">Trader / business</option>
              <option value="private">Private seller</option>
            </select>
          </label>
          <label className="mt-4 block text-sm font-medium">
            Refund policy
            <textarea
              value={settings.refundPolicy?.text || ''}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  refundPolicy: {
                    text: event.target.value,
                  },
                }))
              }
              placeholder="Explain when refunds are available."
              className="mt-2 min-h-20 w-full border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="mt-4 flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(settings.paymentsEnabled)}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  paymentsEnabled: event.target.checked,
                }))
              }
            />
            Enable payments
          </label>
          <label className="mt-2 flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(settings.ticketSalesEnabled)}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  ticketSalesEnabled: event.target.checked,
                }))
              }
            />
            Open ticket sales
          </label>
          <button
            type="button"
            disabled={state.saving}
            onClick={save}
            className="ui-action mt-4 bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
          >
            Save payment setup
          </button>
          {readiness && (
            <p className="mt-3 text-sm text-muted-foreground">
              {readiness.ticketSalesReady
                ? 'Ready to sell tickets'
                : !readiness.sellerProfileComplete
                  ? 'Business details required'
                  : !readiness.paymentAccountReady
                    ? 'Complete ticket payment setup'
                    : 'Save your seller and ticket sales settings to start selling.'}
            </p>
          )}
          {readiness?.ticketSalesReady && (
            <form onSubmit={addTicket} className="mt-7 border-t border-border pt-5">
              <h3 className="font-display text-xl font-semibold">Add ticket type</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  required
                  value={ticket.name}
                  onChange={(event) =>
                    setTicket((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ticket name"
                  className="min-h-11 border border-border bg-background px-3"
                />
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={ticket.price}
                  onChange={(event) =>
                    setTicket((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  placeholder="Price"
                  className="min-h-11 border border-border bg-background px-3"
                />
                <input
                  value={ticket.quantityAvailable}
                  onChange={(event) =>
                    setTicket((current) => ({
                      ...current,
                      quantityAvailable: event.target.value,
                    }))
                  }
                  min="1"
                  type="number"
                  placeholder="Quantity (optional)"
                  className="min-h-11 border border-border bg-background px-3"
                />
                <input
                  value={ticket.description}
                  onChange={(event) =>
                    setTicket((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Description"
                  className="min-h-11 border border-border bg-background px-3"
                />
              </div>
              <button
                disabled={state.saving}
                className="ui-action mt-3 border border-border px-4 py-2 text-sm"
              >
                Add ticket type
              </button>
              <Link
                to={`/events/${eventId}/tickets`}
                className="ml-4 text-sm text-primary underline"
              >
                Open buyer checkout
              </Link>
            </form>
          )}
          {state.error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {state.error}
            </p>
          )}
          {state.notice && <p className="mt-4 text-sm text-primary">{state.notice}</p>}
        </>
      )}
    </section>
  );
}
