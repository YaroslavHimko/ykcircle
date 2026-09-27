import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import SiteChrome from "@/components/SiteChrome";
import { apiFetch } from "@/lib/api";
import { ticketVerificationUrl } from "@/lib/ticket-values";

const auth = () => ({ Authorization: "Bearer " + localStorage.getItem("authToken") });
const money = (amount, currency = "SEK") => new Intl.NumberFormat("sv-SE", { style: "currency", currency }).format(Number(amount || 0));
const user = () => { try { return JSON.parse(localStorage.getItem("authUser") || "null"); } catch { return null; } };
const when = (value, timezone) => {
  if (!value) return "To be announced";
  const text = String(value).replace(" ", "T");
  const instant = new Date(/(Z|[+-]\d\d:\d\d)$/.test(text) ? text : text + "Z");
  return Number.isNaN(instant.getTime()) ? "To be announced" : new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short", timeZone: timezone || "UTC" }).format(instant);
};
async function request(path, options = {}) {
  const response = await apiFetch(path, { ...options, headers: { ...auth(), ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to load tickets.");
  return data;
}
function Shell({ title, children }) {
  return <SiteChrome><section className="mx-auto max-w-4xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><p className="text-xs uppercase tracking-[0.25em] text-primary">Event tickets</p><h1 className="mt-2 font-display text-4xl font-bold">{title}</h1>{children}</section></SiteChrome>;
}
function ErrorNotice({ message }) { return message ? <p role="alert" className="mt-5 border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{message}</p> : null; }
function TestNotice({ checkout = false }) {
  return <aside className="mt-5 border border-amber-500/40 bg-amber-500/10 p-4 text-sm"><strong>Stripe test mode — no real money is charged.</strong>{checkout && <p className="mt-2">At Stripe checkout, use card <code>4242 4242 4242 4242</code>, any future expiry date, and any three-digit CVC. Your ticket email will still be sent to your account email.</p>}</aside>;
}

function TicketQr({ ticket, size = 128 }) {
  const value = ticketVerificationUrl(ticket.code, window.location.origin);
  return <div className="shrink-0 bg-white p-2 text-center text-black">
    <QRCodeSVG value={value} size={size} level="M" marginSize={4} title={`Ticket ${ticket.code}`} className="mx-auto h-auto max-w-full" />
    <p className="mt-1 text-[0.65rem] font-medium uppercase tracking-[0.14em]">Ticket QR</p>
  </div>;
}

function PrintableTickets({ order }) {
  return <section className="ticket-print-root" aria-label="Printable tickets">
    {order.tickets?.map((ticket) => <article key={ticket.id} className="ticket-print-card">
      <header className="ticket-print-header">
        <div><p className="ticket-print-brand">YKCircle</p><p className="ticket-print-kicker">Event admission</p></div>
        {order.testMode && <span className="ticket-print-test">Test ticket</span>}
      </header>
      <div className="ticket-print-body">
        <div className="ticket-print-details">
          <p className="ticket-print-type">{ticket.name}</p>
          <h1>{order.eventTitle}</h1>
          <dl>
            <div><dt>Date and time</dt><dd>{when(order.event?.startsAt, order.event?.timezone)}</dd></div>
            {order.event?.location && <div><dt>Location</dt><dd>{order.event.location}</dd></div>}
            <div><dt>Attendee</dt><dd>{order.attendeeEmail}</dd></div>
            <div><dt>Order</dt><dd>{order.orderNumber}</dd></div>
            {order.seller?.legalName && <div><dt>Seller</dt><dd>{order.seller.legalName}</dd></div>}
          </dl>
        </div>
        <TicketQr ticket={ticket} size={184} />
      </div>
      <footer className="ticket-print-footer">
        <div><p>Ticket code</p><strong>{ticket.code}</strong></div>
        <p>{ticket.checkedInAt ? "Already checked in" : ticket.valid ? "Valid for one admission" : "Not valid for admission"}</p>
      </footer>
    </article>)}
  </section>;
}

export function TicketCheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [context, setContext] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [state, setState] = useState({ loading: true, error: "", paying: false });
  const attempt = useRef(null);
  useEffect(() => {
    let active = true;
    setState({ loading: true, error: "", paying: false });
    request("/api/events/" + id + "/ticket-checkout").then((data) => { if (active) { setContext(data); setQuantities({}); } })
      .catch((error) => { if (active) setState((current) => ({ ...current, error: error.message })); })
      .finally(() => { if (active) setState((current) => ({ ...current, loading: false })); });
    return () => { active = false; };
  }, [id]);
  const items = Object.entries(quantities).filter(([, quantity]) => quantity > 0).map(([ticketTypeId, quantity]) => ({ ticketTypeId: Number(ticketTypeId), quantity }));
  const total = (context?.tickets || []).reduce((sum, ticket) => sum + Math.round(Number(ticket.price) * 100) * (quantities[ticket.id] || 0), 0) / 100;
  const buy = async () => {
    if (!localStorage.getItem("authToken")) return navigate("/login?from=" + encodeURIComponent(window.location.pathname));
    if (!items.length || state.paying) return;
    setState((current) => ({ ...current, paying: true, error: "" }));
    const selection = JSON.stringify(items);
    const key = "ticket-checkout-" + id;
    try {
      // Keep an attempt stable across network retries and page refreshes.
      let saved;
      try { saved = JSON.parse(sessionStorage.getItem(key) || "null"); } catch { /* storage is optional */ }
      if (!attempt.current && saved?.selection === selection) attempt.current = saved;
      if (attempt.current?.selection !== selection) attempt.current = { selection, checkoutKey: crypto.randomUUID() };
      try { sessionStorage.setItem(key, JSON.stringify(attempt.current)); } catch { /* storage is optional */ }
      const checkout = await request("/api/events/" + id + "/ticket-checkout", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, checkoutKey: attempt.current.checkoutKey }),
      });
      window.location.assign(checkout.checkoutUrl);
    } catch (error) { setState((current) => ({ ...current, paying: false, error: error.message })); }
  };
  if (state.loading) return <Shell title="Tickets"><p className="mt-8">Loading tickets…</p></Shell>;
  if (!context) return <Shell title="Tickets"><ErrorNotice message={state.error} /><Link to={"/events/" + id} className="mt-5 inline-block text-primary underline">Back to event</Link></Shell>;
  return <Shell title={"Tickets for " + context.title}>
    {context.testMode && <TestNotice checkout />}
    <p className="mt-5 text-muted-foreground">Sold by {context.seller?.legalName}. Pay securely with Stripe and receive one ticket code per admission by email.</p>
    {user()?.email && <p className="mt-2 text-sm">Delivery email: <strong>{user().email}</strong></p>}
    <ErrorNotice message={state.error} />
    <div className="mt-7 space-y-3">{context.tickets.map((ticket) => {
      const maximum = ticket.quantityAvailable == null ? 20 : Math.min(20, Math.max(0, Number(ticket.quantityAvailable) - Number(ticket.quantitySold) - Number(ticket.quantityReserved || 0)));
      return <article key={ticket.id} className="grid gap-3 border border-border p-5 sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <div><h2 className="font-display text-xl font-semibold">{ticket.name}</h2><p className="mt-1 text-sm text-muted-foreground">{ticket.description}</p>{!maximum && <p className="text-sm text-destructive">Sold out</p>}</div>
        <p>{money(ticket.price, ticket.currency)}</p>
        <label className="text-sm">Quantity for {ticket.name}<select disabled={state.paying || !maximum} value={quantities[ticket.id] || 0} onChange={(event) => setQuantities((current) => ({ ...current, [ticket.id]: Number(event.target.value) }))} className="ml-2 min-h-11 border border-border bg-background px-3">{Array.from({ length: maximum + 1 }, (_, quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}</select></label>
      </article>;
    })}{!context.tickets.length && <p>No tickets are on sale yet.</p>}</div>
    {context.refundPolicy?.text && <p className="mt-5 text-sm text-muted-foreground">Refund policy: {context.refundPolicy.text}</p>}
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5"><p className="font-display text-2xl">Total: {money(total, context.currency)}</p><button disabled={state.paying || total <= 0} onClick={buy} className="bg-primary px-5 py-3 text-sm text-primary-foreground disabled:opacity-60">{state.paying ? "Opening Stripe…" : context.testMode ? "Continue to test payment" : "Continue to payment"}</button></div>
    <div className="mt-5 flex gap-5 text-sm"><Link to={"/events/" + id} className="text-primary underline">Back to event</Link><Link to="/account/tickets" className="text-primary underline">My tickets and unpaid orders</Link></div>
  </Shell>;
}

export function TicketsPage({ success = false }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const rows = await request("/api/me/tickets");
        if (active) { setOrders(Array.isArray(rows) ? rows : rows.orders || []); setError(""); }
      } catch (error) { if (active) setError(error.message); }
      finally { if (active) setLoading(false); }
    };
    if (!localStorage.getItem("authToken")) { setError("Sign in to view your tickets."); setLoading(false); return; }
    void load();
    const timer = setInterval(load, 15000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  return <Shell title="My tickets">
    {success && <p className="mt-5">Open your order to check payment confirmation and view your tickets.</p>}
    <ErrorNotice message={error} />
    {loading ? <p className="mt-8">Loading tickets…</p> : <div className="mt-7 space-y-3">{orders.map((order) => <Link key={order.id} to={"/tickets/" + order.id} className="block border border-border p-5 hover:border-primary"><div className="flex justify-between gap-3"><span>{order.orderNumber}</span><span className="capitalize">{order.paymentStatus}</span></div><p className="mt-2 text-sm">{money(order.totalAmount, order.currency)}</p></Link>)}{!orders.length && <p>No ticket orders yet.</p>}</div>}
  </Shell>;
}

export function TicketOrderPage() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState(false);
  const load = useCallback(async (confirm = false) => {
    const data = await request("/api/ticket-orders/" + id + (confirm ? "/confirm" : ""), confirm ? { method: "POST" } : {});
    setOrder(data);
    return data;
  }, [id]);
  useEffect(() => {
    let active = true;
    let timer;
    let polls = 0;
    const refresh = async () => {
      try {
        const data = await request("/api/ticket-orders/" + id);
        if (!active) return;
        setOrder(data);
        if (data.paymentStatus === "pending" && Number(data.attendeeUserId) === Number(user()?.id)) {
          const confirmed = await request("/api/ticket-orders/" + id + "/confirm", { method: "POST" });
          if (!active) return;
          setOrder(confirmed);
          if (confirmed.paymentStatus === "pending" && ++polls < 12) timer = setTimeout(refresh, 10000);
        } else if (data.emailStatus === "pending" && data.paymentStatus === "paid" && ++polls < 12) timer = setTimeout(refresh, 10000);
        try { sessionStorage.removeItem("ticket-checkout-" + data.eventId); } catch { /* storage is optional */ }
      } catch (error) { if (active) setError(error.message); }
    };
    void refresh();
    return () => { active = false; clearTimeout(timer); };
  }, [id]);
  const action = async (type) => {
    setWorking(true); setError(""); setNotice("");
    try {
      if (type === "confirm") await load(true);
      else {
        const result = await request("/api/ticket-orders/" + id + "/" + type, { method: "POST" });
        if (result.checkoutUrl) return window.location.assign(result.checkoutUrl);
        setNotice(result.message || "");
        await load();
      }
    } catch (error) { setError(error.message); } finally { setWorking(false); }
  };
  const paid = order?.paymentStatus === "paid";
  const buyer = Number(order?.attendeeUserId) === Number(user()?.id);
  return <Shell title={paid ? "Your tickets" : "Ticket order"}>
    <Link to="/account/tickets" className="mt-4 inline-block text-sm text-primary underline">My tickets</Link>
    <ErrorNotice message={error} />
    {notice && <p role="status" className="mt-4 text-primary">{notice}</p>}
    {!order && !error && <p className="mt-8">Loading order…</p>}
    {order && <>
      {order.testMode && <TestNotice />}
      <article className="mt-6 border border-border p-5">
        <h2 className="font-display text-2xl font-semibold">{order.eventTitle}</h2>
        <p className="mt-2">{when(order.event?.startsAt, order.event?.timezone)}</p><p>{order.event?.location}</p>
        <p className="mt-3 text-sm">Order {order.orderNumber} · {money(order.totalAmount, order.currency)} · <span className="capitalize">{order.paymentStatus}</span></p>
        {paid ? <p role="status" className="mt-5 text-primary">Payment confirmed. {order.emailStatus === "sent" ? "Tickets were sent to " : "Tickets are queued for delivery to "}{order.attendeeEmail}.</p> : order.paymentStatus === "pending" ? <p role="status" className="mt-5">{location.search.includes("cancelled") ? "Checkout was not completed. Resume payment or cancel this order to release your tickets." : "Waiting for Stripe to confirm payment. Tickets are issued only after confirmation."}</p> : <p className="mt-5">This order is {order.paymentStatus.replaceAll("_", " ")}. Its tickets are not valid for admission.</p>}
        <div className="mt-5 space-y-3">{order.tickets?.map((ticket) => <div key={ticket.id} className="grid gap-4 border border-dashed border-border p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><h3 className="font-semibold">{ticket.name}</h3><p className="mt-2 break-all font-mono text-sm">{ticket.code}</p><p className="mt-2 text-xs">{ticket.checkedInAt ? "Already checked in." : ticket.valid ? "One admission — show this ticket at the event." : "Not valid for admission."}</p></div><TicketQr ticket={ticket} /></div>)}</div>
        {!order.tickets?.length && order.items?.map((item) => <p key={item.id} className="mt-3">{item.ticketType?.name} × {item.quantity}</p>)}
        {buyer && <div className="mt-6 flex flex-wrap gap-3 print:hidden">{paid ? <><button onClick={() => window.print()} className="border border-border px-4 py-2 text-sm">Print tickets</button><button disabled={working} onClick={() => action("resend")} className="border border-border px-4 py-2 text-sm disabled:opacity-60">Resend email</button></> : order.paymentStatus === "pending" && <><button disabled={working} onClick={() => action("confirm")} className="border border-border px-4 py-2 text-sm">Refresh payment status</button><button disabled={working} onClick={() => action("checkout")} className="bg-primary px-4 py-2 text-sm text-primary-foreground">Resume payment</button><button disabled={working} onClick={() => action("cancel")} className="border border-border px-4 py-2 text-sm">Cancel unpaid order</button></>}</div>}
        <p className="mt-5 text-sm text-muted-foreground">Seller: {order.seller?.legalName}</p>
        {order.refundPolicy?.text && <p className="mt-2 text-sm text-muted-foreground">Refund policy: {order.refundPolicy.text}</p>}
      </article>
      {paid && order.tickets?.length > 0 && <PrintableTickets order={order} />}
      <Link to={"/events/" + order.eventId} className="mt-5 inline-block text-sm text-primary underline">Back to event</Link>
    </>}
  </Shell>;
}
