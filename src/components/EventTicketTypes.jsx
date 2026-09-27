import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function EventTicketTypes({ eventId, token, revision = 0 }) {
  const [state, setState] = useState({ tickets: [], loading: true, error: "" });
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ tickets: [], loading: true, error: "" });
    apiFetch(`/api/events/${eventId}/ticket-types/manage`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load ticket types.");
        if (!Array.isArray(data)) throw new Error("Unable to load ticket types.");
        if (!cancelled) setState({ tickets: data, loading: false, error: "" });
      })
      .catch((error) => {
        if (!cancelled) setState({ tickets: [], loading: false, error: error.message });
      });
    return () => { cancelled = true; };
  }, [eventId, token, revision, refresh]);

  return <section aria-label="Saved ticket types" className="mt-6 border-t border-border pt-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-display text-xl font-semibold">Ticket types</h3>
      <button type="button" disabled={state.loading} onClick={() => setRefresh((current) => current + 1)} className="text-sm text-primary underline disabled:opacity-60">Refresh tickets</button>
    </div>
    <p className="mt-2 text-sm text-muted-foreground">Saved ticket types are shown here even when ticket sales are closed.</p>
    {state.loading ? <p role="status" className="mt-4 text-sm text-muted-foreground">Loading ticket types?</p>
      : state.error ? <p role="alert" className="mt-4 text-sm text-destructive">{state.error}</p>
      : !state.tickets.length ? <p className="mt-4 text-sm text-muted-foreground">No ticket types added yet.</p>
      : <ul className="mt-4 space-y-3">{state.tickets.map((ticket) => {
        const sold = Number(ticket.quantitySold || 0);
        const reserved = Number(ticket.quantityReserved || 0);
        const remaining = ticket.quantityAvailable == null ? null : Math.max(0, Number(ticket.quantityAvailable) - sold - reserved);
        return <li key={ticket.id} className="border border-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h4 className="font-semibold">{ticket.name}</h4>
            <span className="text-sm text-muted-foreground">{ticket.isActive ? "Active" : "Inactive"}</span>
          </div>
          {ticket.description && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{ticket.description}</p>}
          <p className="mt-2 text-sm font-medium">{Number(ticket.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {ticket.currency}</p>
          <p className="mt-2 text-sm text-muted-foreground">{sold} sold ? {reserved} reserved ? {remaining == null ? "Unlimited quantity" : `${remaining} remaining of ${ticket.quantityAvailable}`}</p>
        </li>;
      })}</ul>}
  </section>;
}
