import { useProductConfiguration } from '@/lib/product-configuration';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";
import { priceLabel as venuePriceLabel } from "./VenueMarketplace";
import SiteChrome from "@/components/SiteChrome";
import VenueBookingConversation from "@/components/VenueBookingConversation";
import { apiFetch } from "@/lib/api";
import { venueMediaUrl } from "@/lib/media";

const isVenueActive = (value) => value === true || value === 1 || value === "1" || value === "true";
const list = (data, key) => Array.isArray(data) ? data : data?.[key] || [];
const locationText = (location) => typeof location === "string" ? location : location?.addressLine1 || location?.address || location?.locality || location?.city || location?.municipality || location?.region || location?.country || "";
const normalizeVenue = (venue) => ({ ...venue, id: venue?.id ?? venue?.venueId ?? venue?.venue_id ?? venue?.venue?.id, location: locationText(venue?.location) });
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("authToken")}` });
const errorText = (data, fallback) => [data?.error || data?.message, data?.fields && Object.entries(data.fields).map(([field, message]) => `${field}: ${message}`).join(" ")].filter(Boolean).join(" ") || fallback;
const bookingStart = (booking) => booking.event?.startsAt || booking.startsAt || booking.startAt || booking.starts_at || null;

export function MyVenuesPage() {
  const product = useProductConfiguration();
  const user = JSON.parse(localStorage.getItem("authUser") || "null"); const isAdmin = user?.role === "admin"; const isManager = user?.role === "manager"; const endpoint = "/api/venues/mine"; const dashboardTitle = "My venues";
  const [venues,setVenues]=useState([]); const [error,setError]=useState(""); const [emptyMessage,setEmptyMessage]=useState(""); const [loading,setLoading]=useState(true); const loadVersion=useRef(0); const load=useCallback(async()=>{const version=++loadVersion.current;setLoading(true);setError("");try{const r=await apiFetch(endpoint,{headers:auth()});const d=await r.json();if(version!==loadVersion.current)return;if(r.status===404){setVenues([]);setEmptyMessage(errorText(d,"No venues found."));return;}if(!r.ok)throw new Error(errorText(d,"Unable to load venues."));setVenues(list(d,"venues").map(normalizeVenue).filter((venue)=>venue.id!=null));setEmptyMessage("");}catch(e){if(version===loadVersion.current)setError(e.message);}finally{if(version===loadVersion.current)setLoading(false);}},[endpoint]); useEffect(()=>{load();},[load]);
  const remove=async id=>{if(!window.confirm("Delete this venue?"))return; try {const r=await apiFetch(`/api/venues/${id}`,{method:"DELETE",headers:auth()});const d=r.status===204?null:await r.json().catch(()=>({}));if(!r.ok)throw new Error(errorText(d,"Unable to delete venue."));load();}catch(e){setError(e.message);}};
  const toggleActive=async venue=>{try{setError("");if(venue?.id==null)throw new Error("This venue is missing its ID and cannot be updated.");const r=await apiFetch(`/api/venues/${venue.id}`,{method:"PATCH",headers:{...auth(),"Content-Type":"application/json"},body:JSON.stringify({isActive:!isVenueActive(venue.isActive)})});const d=await r.json();if(!r.ok)throw new Error(errorText(d,"Unable to update venue state."));const updated=normalizeVenue(d.venue||d);setVenues(current=>current.map(item=>item.id===venue.id?{...item,...updated,isActive:isVenueActive(updated.isActive)}:item));}catch(e){setError(e.message);}};
  const publish=async venue=>{try{setError("");if(venue?.id==null)throw new Error("This venue is missing its ID and cannot be published.");const r=await apiFetch(`/api/admin/venues/${venue.id}/moderation`,{method:"PATCH",headers:{...auth(),"Content-Type":"application/json"},body:JSON.stringify({moderationStatus:"approved"})});const d=r.status===204?null:await r.json().catch(()=>({}));if(!r.ok)throw new Error(errorText(d,"Unable to publish venue."));const updated=normalizeVenue(d.venue||d);setVenues(current=>current.map(item=>item.id===venue.id?{...item,...updated,isActive:isVenueActive(updated.isActive)}:item));}catch(e){setError(e.message);}};
  const submitForReview=async venue=>{try{setError("");if(venue?.id==null)throw new Error("This venue is missing its ID and cannot be submitted for review.");const r=await apiFetch(`/api/venues/${venue.id}/submit-for-review`,{method:"POST",headers:auth()});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(errorText(d,"Unable to submit venue for review."));const updated=normalizeVenue(d.venue||d);setVenues(current=>current.map(item=>item.id===venue.id?{...item,...updated,isActive:isVenueActive(updated.isActive)}:item));}catch(e){setError(e.message);}};
  return <Shell title={dashboardTitle}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl font-bold">{dashboardTitle}</h1>
        <p className="mt-2 text-muted-foreground">{isAdmin || isManager ? "Review all active and inactive venues." : "Create spaces and respond to event booking requests."}</p>
      </div>
      <Link to="/profile/venues/new" className="ui-action inline-flex min-h-11 shrink-0 items-center justify-center self-center bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Add venue</Link>
    </div>
    {error && <Error text={error}/>}
    {loading ? <Loading label="Loading venues…"/> : <>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {venues.map(v => {
          const owner = v.owner || v.user || {};
          const ownerName = owner.name || v.ownerName || v.ownerEmail || "Not supplied";
          const active = isVenueActive(v.isActive);
          const moderationStatus = v.moderationStatus || "draft";
          const coverImage = venueMediaUrl(v);
          return <article key={v.id} className="overflow-hidden rounded-xl border border-border/70 transition-shadow hover:shadow-md">
            <div className="flex h-full flex-col">
              <div className="relative aspect-[16/10] overflow-hidden bg-secondary/60">
                {coverImage ? <img src={coverImage} loading="lazy" alt={`Preview of ${v.name}`} className="h-full w-full object-cover" /> : <div className="flex h-full min-h-28 items-end bg-[linear-gradient(135deg,hsl(var(--primary)/.16),hsl(var(--secondary)))] p-4 font-display text-lg text-muted-foreground">Venue</div>}
                <span className="absolute right-3 top-3 max-w-[calc(100%-1.5rem)] rounded-full bg-background/95 px-3 py-1.5 text-xs font-medium shadow-sm">{venuePriceLabel(v)}</span>
              </div>
              <div className="min-w-0 p-5">
                <div className="flex justify-between gap-3"><h2 className="font-display text-2xl font-semibold">{v.name}</h2><div className="flex flex-wrap items-center gap-2"><ModerationStatus status={moderationStatus} /><Status status={active ? "active" : "inactive"}/></div></div>
                <dl className="mt-4 grid gap-2 text-sm"><div><dt className="inline text-muted-foreground">Business: </dt><dd className="inline">{v.businessName || "Not supplied"}</dd></div><div><dt className="inline text-muted-foreground">Owner: </dt><dd className="inline">{ownerName}</dd></div><div><dt className="inline text-muted-foreground">Location: </dt><dd className="inline">{[v.location, v.address, v.city, v.country].filter(Boolean).join(", ") || "Not supplied"}</dd></div><div><dt className="inline text-muted-foreground">Timezone: </dt><dd className="inline">{v.timezone || "Not supplied"}</dd></div></dl>
                <div className="mt-5 flex flex-wrap gap-2 text-sm"><Link className="ui-action border border-border px-4 py-2" to={`/venues/${v.id}`}>Venue details</Link><Link className="ui-action border border-border px-4 py-2" to={`/profile/venues/${v.id}/edit`}>Edit & availability</Link><Link className="ui-action border border-border px-4 py-2" to={`/profile/venues/${v.id}/bookings`}>Booking list</Link>{product.paidVenuesEnabled && <Link className="ui-action border border-border px-4 py-2" to={`/account/billing?section=invoices&venueId=${encodeURIComponent(v.id)}`}>Invoices</Link>}{isAdmin && moderationStatus !== "approved" && <button type="button" onClick={() => publish(v)} className="ui-action bg-primary px-4 py-2 text-primary-foreground">Approve</button>}{!isAdmin && ["draft", "rejected"].includes(moderationStatus) && <button type="button" onClick={() => submitForReview(v)} className="ui-action bg-primary px-4 py-2 text-primary-foreground">Submit for review</button>}{!isAdmin && moderationStatus === "pending" && <span className="px-4 py-2 text-muted-foreground">Awaiting review</span>}{(isAdmin || isManager) && <button type="button" onClick={() => toggleActive(v)} className="ui-action border border-border px-4 py-2">{active ? "Deactivate" : "Activate"}</button>}<button type="button" onClick={() => remove(v.id)} className="ui-action border border-destructive px-4 py-2 text-destructive">Delete</button></div>
              </div>
            </div>
          </article>;
        })}
      </div>
      {!venues.length && !error && <p className="mt-8 text-muted-foreground">{emptyMessage || "No venues found."}</p>}
    </>}
  </Shell>;
}

export function VenueBookingsPage() {
  const product = useProductConfiguration();
  const { id } = useParams();
  const [bookings, setBookings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [ownerNote, setOwnerNote] = useState("");
  const [billingSetupBlocked, setBillingSetupBlocked] = useState(false);
  const [notification, setNotification] = useState("");
  const loadVersion = useRef(0);

  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    setError("");
    try {
      if (!id) throw new Error("This venue is missing its ID.");
      const [bookingsResponse, inquiriesResponse] = await Promise.all([
        apiFetch(`/api/venues/${id}/bookings`, { headers: auth() }),
        apiFetch(`/api/venues/${id}/inquiries`, { headers: auth() }),
      ]);
      const [bookingsData, inquiriesData] = await Promise.all([
        bookingsResponse.json(),
        inquiriesResponse.json(),
      ]);
      if (version !== loadVersion.current) return;
      if (!bookingsResponse.ok) throw new Error(errorText(bookingsData, "Unable to load event bookings."));
      if (!inquiriesResponse.ok) throw new Error(errorText(inquiriesData, "Unable to load venue inquiries."));
      setBookings(list(bookingsData, "bookings"));
      setInquiries(list(inquiriesData, "inquiries"));
    } catch (requestError) {
      if (version === loadVersion.current) setError(requestError.message);
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const openReview = (booking, status) => {
    setOwnerNote(booking.ownerNote || "");
    setBillingSetupBlocked(false);
    setNotification("");
    setReviewing({ booking, status });
  };

  const review = async (event) => {
    event.preventDefault();
    if (!reviewing) return;
    const { booking, status } = reviewing;
    try {
      const response = await apiFetch(`/api/venue-bookings/${booking.id}`, {
        method: "PATCH",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ status, ownerNote }),
      });
      const data = await response.json();
      if (!response.ok && data?.code === "FINANCIAL_SETUP_INCOMPLETE") {
        setReviewing(null);
        setBillingSetupBlocked(true);
        const missing = Array.isArray(data.missing) && data.missing.length ? ` Missing: ${data.missing.join(", ")}.` : "";
        setNotification(`${data.error || "Complete the Venue payment setup before approving this paid booking."}${missing}`);
        return;
      }
      if (!response.ok) throw new Error(errorText(data, "Unable to update booking."));
      setReviewing(null);
      if (data.warning) setNotification("Booking approved, but invoice document generation failed. Open the invoice to retry the protected PDF.");
      load();
    } catch (requestError) {
      setNotification(requestError.message);
    }
  };

  return <Shell title="Venue requests">
    <Link to="/profile/venues" className="text-sm text-primary underline">Back to my venues</Link>
    {product.paidVenuesEnabled && <Link to={`/account/payments/venues?venueId=${id}&edit=1&returnTo=${encodeURIComponent(window.location.pathname)}`} className="ml-4 text-sm text-primary underline">Venue payments</Link>}
    <h1 className="mt-5 font-display text-4xl font-bold">Venue requests</h1>
    <p className="mt-3 max-w-2xl text-muted-foreground">Direct venue inquiries and event bookings are separate request types. Both are shown below.</p>
    {error && <Error text={error} />}
    {loading ? <Loading label="Loading booking requests…" /> : <div className="mt-8 space-y-3">
      <section className="border-b border-border pb-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3"><h2 className="font-display text-2xl font-semibold">Venue inquiries</h2><p className="text-sm text-muted-foreground">{inquiries.length} request{inquiries.length === 1 ? "" : "s"}</p></div>
        <p className="mt-2 text-sm text-muted-foreground">Requests sent through the “Request venue” form.</p>
        <div className="mt-5 space-y-3">{inquiries.map((inquiry) => <article key={inquiry.id} className="rounded-2xl border border-border p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-semibold">{inquiry.eventName || inquiry.title || "Venue inquiry"}</h3><p className="mt-1 text-sm text-muted-foreground">{inquiry.requestedDate ? new Date(inquiry.requestedDate).toLocaleDateString() : "Date not supplied"}{inquiry.startTime && ` · ${inquiry.startTime}`}{inquiry.endTime && `–${inquiry.endTime}`}</p>{(inquiry.expectedGuests || inquiry.budget) && <p className="mt-1 text-sm text-muted-foreground">{inquiry.expectedGuests ? `${inquiry.expectedGuests} guests` : ""}{inquiry.expectedGuests && inquiry.budget ? " · " : ""}{inquiry.budget ? `Budget: ${inquiry.budget} SEK` : ""}</p>}<p className="mt-3 text-sm">From {inquiry.requesterName || inquiry.user?.name || inquiry.contactName || "Guest"}{(inquiry.requesterEmail || inquiry.user?.email || inquiry.email) && ` · ${inquiry.requesterEmail || inquiry.user?.email || inquiry.email}`}</p>{inquiry.message && <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{inquiry.message}</p>}</div><Status status={inquiry.status || "new"} /></div></article>)}{!inquiries.length && <p className="text-sm text-muted-foreground">No venue inquiries yet.</p>}</div>
      </section>
      <section className="pt-2">
        <div className="flex flex-wrap items-baseline justify-between gap-3"><h2 className="font-display text-2xl font-semibold">Event bookings</h2><p className="text-sm text-muted-foreground">{bookings.length} booking{bookings.length === 1 ? "" : "s"}</p></div>
        <p className="mt-2 text-sm text-muted-foreground">Bookings created from an event’s venue-booking flow.</p>
        <div className="mt-5 space-y-3">
      {bookings.map((booking) => <div key={booking.id} className="rounded-2xl border border-border p-5">
        <div className="flex justify-between gap-4">
          <div>
            <p className="font-semibold">{booking.event?.title || booking.eventTitle || "Event booking"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {bookingStart(booking)
                ? new Date(bookingStart(booking)).toLocaleString()
                : "Date not supplied"}
            </p>
            {booking.organizerEmail && <p className="mt-1 text-sm text-muted-foreground">Organizer: {booking.organizerName || "Event organizer"} · {booking.organizerEmail}</p>}
            {booking.ownerNote && <p className="mt-2 text-sm">Note: {booking.ownerNote}</p>}
            <p className="mt-2 text-sm">Calculated price: <strong>{Number(booking.totalAmount || 0).toLocaleString("sv-SE")} {booking.currency || "SEK"}</strong></p>
            <p className="mt-1 text-sm text-muted-foreground">Buyer: {booking.buyerLegalName || "Not selected"} · Payment: {booking.invoiceStatus || booking.externalInvoiceStatus || booking.paymentStatus || "not required"}</p>
          </div>
          <Status status={booking.status} />
        </div>
        {["requested", "pending"].includes(booking.status) && <div className="mt-4 flex gap-2">
          <button onClick={() => openReview(booking, "confirmed")} className="ui-action bg-primary px-4 py-2 text-sm text-primary-foreground">Confirm</button>
          <button onClick={() => openReview(booking, "declined")} className="ui-action border border-border px-4 py-2 text-sm">Decline</button>
        </div>}
        {product.paidVenuesEnabled && booking.invoiceId && <Link to={`/invoices/${booking.invoiceId}`} className="mt-4 inline-block text-sm text-primary underline">View invoice {booking.invoiceNumber}</Link>}
        {product.paidVenuesEnabled && booking.invoiceMode === "external" && booking.status === "confirmed" && <ExternalInvoiceEditor booking={booking} onSaved={load} onError={setNotification} />}
        <VenueBookingConversation bookingId={booking.id} />
      </div>)}
      {!bookings.length && <p className="text-sm text-muted-foreground">No event bookings yet.</p>}
        </div>
      </section>
    </div>}
    {reviewing && <div role="dialog" aria-modal="true" aria-labelledby="venue-booking-review-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">
      <form onSubmit={review} className="rounded-2xl w-full max-w-lg border border-border bg-background p-6 shadow-xl">
        <h2 id="venue-booking-review-title" className="font-display text-2xl font-semibold">{reviewing.status === "confirmed" ? "Confirm venue booking" : "Decline venue booking"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{reviewing.booking.eventTitle || "This event"} will be {reviewing.status === "confirmed" ? (reviewing.booking.invoiceMode === "external" ? "approved; you will issue the invoice separately" : "approved and invoiced in your organization’s name") : "declined"}.</p>
        <label className="mt-5 block text-sm font-medium">Optional note to event owner<textarea autoFocus value={ownerNote} onChange={(event) => setOwnerNote(event.target.value)} maxLength="5000" className="mt-2 min-h-28 w-full border border-border bg-background p-3" /></label>
        <div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setReviewing(null)} className="ui-action border border-border px-4 py-2 text-sm">Cancel</button><button className={reviewing.status === "confirmed" ? "bg-primary px-4 py-2 text-sm text-primary-foreground" : "border border-destructive px-4 py-2 text-sm text-destructive"}>{reviewing.status === "confirmed" ? "Confirm booking" : "Decline booking"}</button></div>
      </form>
    </div>}
    {notification && <p role="alert" className="fixed bottom-6 left-5 z-[60] max-w-md border border-destructive/30 bg-background px-4 py-3 text-sm text-destructive shadow-lg sm:left-auto sm:right-6">{notification}{billingSetupBlocked && <> {product.paidVenuesEnabled && <Link to={`/account/payments/venues?venueId=${id}&edit=1&returnTo=${encodeURIComponent(window.location.pathname)}`} className="font-medium underline">Complete Venue payment setup</Link>}</>}</p>}
  </Shell>;
}

function ExternalInvoiceEditor({ booking, onSaved, onError }) {
  const [form, setForm] = useState({ externalInvoiceNumber: "", externalInvoiceDate: "", amount: booking.totalAmount || "", currency: booking.currency || "SEK", dueDate: "", externalInvoiceUrl: "" });
  const save = async (event) => { event.preventDefault(); try { const response = await apiFetch(`/api/venue-bookings/${booking.id}/external-invoice`, { method: "PUT", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify(form) }); const data = await response.json(); if (!response.ok) throw new Error(errorText(data, "Unable to save external invoice.")); onSaved(); } catch (error) { onError(error.message); } };
  const paid = async () => { if (!window.confirm("Confirm that the Venue has actually received this payment.")) return; try { const response = await apiFetch(`/api/venue-bookings/${booking.id}/external-invoice/mark-paid`, { method: "POST", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify({ confirmReceived: true }) }); const data = await response.json(); if (!response.ok) throw new Error(errorText(data, "Unable to mark payment received.")); onSaved(); } catch (error) { onError(error.message); } };
  return <details className="mt-4 border-t border-border pt-4"><summary className="cursor-pointer text-sm font-medium">External invoice details</summary><form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Invoice number" value={form.externalInvoiceNumber} onChange={(value) => setForm({ ...form, externalInvoiceNumber: value })} /><Field label="Invoice date" value={form.externalInvoiceDate} onChange={(value) => setForm({ ...form, externalInvoiceDate: value })} /><Field label="Amount" value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} /><Field label="Currency" value={form.currency} onChange={(value) => setForm({ ...form, currency: value })} /><Field label="Due date" value={form.dueDate} onChange={(value) => setForm({ ...form, dueDate: value })} /><Field label="Secure invoice URL" value={form.externalInvoiceUrl} onChange={(value) => setForm({ ...form, externalInvoiceUrl: value })} /><div className="sm:col-span-2 flex gap-2"><button className="ui-action border border-border px-4 py-2 text-sm">Save external invoice</button>{booking.externalInvoiceId && booking.externalInvoiceStatus !== "paid" && <button type="button" onClick={paid} className="ui-action bg-primary px-4 py-2 text-sm text-primary-foreground">Mark payment received</button>}</div></form></details>;
}

function Shell({title,children}){return <SiteChrome><Helmet><title>{title} | YKCircle</title></Helmet><section className="mx-auto max-w-[72rem] px-5 pb-24 pt-10 sm:px-8 sm:pt-14">{children}</section></SiteChrome>}; function Loading({label="Loading…"}){return <p role="status" className="mt-8 text-muted-foreground">{label}</p>}; function Field({label,required,value,onChange}){return <label className="block text-sm font-medium">{label}{required&&" *"}<input required={required} value={value} onChange={e=>onChange(e.target.value)} className="mt-2 min-h-11 w-full border border-border bg-background px-3"/></label>}; function Error({text}){return <p role="alert" className="rounded-2xl mt-5 border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{text}</p>}; function Status({status}){return <span className="whitespace-nowrap text-sm capitalize text-primary">{status||"pending"}</span>};
const moderationLabels={draft:"Draft",pending:"Pending review",approved:"Published",rejected:"Rejected",removed:"Removed"};
const moderationStyles={approved:"border-primary text-primary",rejected:"border-destructive text-destructive",removed:"border-destructive text-destructive"};
function ModerationStatus({status}){const value=status||"draft";return <span className={`whitespace-nowrap border px-2 py-1 text-xs font-semibold uppercase tracking-wider ${moderationStyles[value]||"border-border text-muted-foreground"}`}>{moderationLabels[value]||value}</span>}
