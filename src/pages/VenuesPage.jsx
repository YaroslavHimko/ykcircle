import React, { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useNavigate, useParams } from "react-router-dom";
import SiteChrome from "@/components/SiteChrome";
import VenueBookingConversation from "@/components/VenueBookingConversation";
import { apiFetch } from "@/lib/api";

const blankVenue = { name: "", businessName: "", description: "", location: "", country: "", city: "", address: "", latitude: "", longitude: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", isActive: true };
const isVenueActive = (value) => value === true || value === 1 || value === "1" || value === "true";
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const list = (data, key) => Array.isArray(data) ? data : data?.[key] || [];
const locationText = (location) => typeof location === "string" ? location : location?.addressLine1 || location?.address || location?.locality || location?.city || location?.municipality || location?.region || location?.country || "";
const normalizeVenue = (venue) => ({ ...venue, id: venue?.id ?? venue?.venueId ?? venue?.venue_id ?? venue?.venue?.id, location: locationText(venue?.location) });
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("authToken")}` });
const errorText = (data, fallback) => [data?.error || data?.message, data?.fields && Object.entries(data.fields).map(([field, message]) => `${field}: ${message}`).join(" ")].filter(Boolean).join(" ") || fallback;
const bookingStart = (booking) => booking.event?.startsAt || booking.startsAt || booking.startAt || booking.starts_at || null;

export function VenueOwnerApplicationPage() {
  const navigate = useNavigate(); const [application, setApplication] = useState(null); const [form, setForm] = useState({ businessName: "", message: "" }); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => { if (!localStorage.getItem("authToken")) { navigate("/login"); return; } apiFetch("/api/venue-owner-applications/me", { headers: auth() }).then(async r => { const d = await r.json(); if (r.ok) setApplication(d.application || d); else if (r.status !== 404) setError(errorText(d, "Unable to load application.")); }).catch(e => setError(e.message)); }, [navigate]);
  const submit = async e => { e.preventDefault(); setSaving(true); setError(""); try { const r = await apiFetch("/api/venue-owner-applications", { method: "POST", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify(form) }); const d = await r.json(); if (!r.ok) throw new Error(errorText(d, "Unable to submit application.")); setApplication(d.application || d); } catch (e) { setError(e.message); } finally { setSaving(false); } };
  return <Shell title="Become a venue owner"><h1 className="font-display text-4xl font-bold">Become a venue owner</h1><p className="mt-3 text-muted-foreground">Apply to list and manage spaces for community events.</p>{error && <Error text={error}/>} {application ? <StatusCard item={application} label="Application"/> : <form onSubmit={submit} className="mt-8 max-w-xl space-y-5 border border-border p-6"><Field label="Business name" required value={form.businessName} onChange={v=>setForm({...form,businessName:v})}/><label className="block text-sm font-medium">Message<textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} className="mt-2 min-h-28 w-full border border-border bg-background p-3" /></label><button disabled={saving} className="bg-primary px-5 py-3 text-sm text-primary-foreground disabled:opacity-60">{saving ? "Submitting…" : "Submit application"}</button></form>}</Shell>;
}

export function AdminVenueApplicationsPage() {
  const [items, setItems] = useState([]); const [error, setError] = useState("");
  const load = () => apiFetch("/api/admin/venue-owner-applications", { headers: auth() }).then(async r => { const d=await r.json(); if(!r.ok) throw new Error(errorText(d,"Unable to load applications.")); setItems(list(d,"applications")); }).catch(e=>setError(e.message)); useEffect(load,[]);
  const review = async (id,status) => { try { const r=await apiFetch(`/api/admin/venue-owner-applications/${id}/review`,{method:"PATCH",headers:{...auth(),"Content-Type":"application/json"},body:JSON.stringify({status})}); const d=await r.json(); if(!r.ok) throw new Error(errorText(d,"Unable to review application.")); load(); }catch(e){setError(e.message);} };
  return <Shell title="Venue owner applications"><h1 className="font-display text-4xl font-bold">Venue owner applications</h1>{error&&<Error text={error}/>}<div className="mt-8 space-y-3">{items.map(x=><div key={x.id} className="border border-border p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{x.businessName}</p><p className="text-sm text-muted-foreground">{x.user?.name || x.name || x.email}</p>{x.message&&<p className="mt-2 text-sm">{x.message}</p>}</div><Status status={x.status}/></div>{x.status === "pending"&&<div className="mt-4 flex gap-2"><button onClick={()=>review(x.id,"approved")} className="bg-primary px-4 py-2 text-sm text-primary-foreground">Approve</button><button onClick={()=>review(x.id,"declined")} className="border border-border px-4 py-2 text-sm">Decline</button></div>}</div>)}{!items.length&&!error&&<p className="mt-8 text-muted-foreground">No applications to review.</p>}</div></Shell>;
}

export function MyVenuesPage() {
  const user = JSON.parse(localStorage.getItem("authUser") || "null"); const isAdmin = user?.role === "admin"; const isManager = user?.role === "manager"; const endpoint = "/api/venues/mine"; const dashboardTitle = "My venues";
  const [venues,setVenues]=useState([]); const [error,setError]=useState(""); const [emptyMessage,setEmptyMessage]=useState(""); const [loading,setLoading]=useState(true); const loadVersion=useRef(0); const load=useCallback(async()=>{const version=++loadVersion.current;setLoading(true);setError("");try{const r=await apiFetch(endpoint,{headers:auth()});const d=await r.json();if(version!==loadVersion.current)return;if(r.status===404){setVenues([]);setEmptyMessage(errorText(d,"No venues found."));return;}if(!r.ok)throw new Error(errorText(d,"Unable to load venues."));setVenues(list(d,"venues").map(normalizeVenue).filter((venue)=>venue.id!=null));setEmptyMessage("");}catch(e){if(version===loadVersion.current)setError(e.message);}finally{if(version===loadVersion.current)setLoading(false);}},[endpoint]); useEffect(()=>{load();},[load]);
  const remove=async id=>{if(!window.confirm("Delete this venue?"))return; try {const r=await apiFetch(`/api/venues/${id}`,{method:"DELETE",headers:auth()});const d=r.status===204?null:await r.json().catch(()=>({}));if(!r.ok)throw new Error(errorText(d,"Unable to delete venue."));load();}catch(e){setError(e.message);}};
  const toggleActive=async venue=>{try{setError("");if(venue?.id==null)throw new Error("This venue is missing its ID and cannot be updated.");const r=await apiFetch(`/api/venues/${venue.id}`,{method:"PATCH",headers:{...auth(),"Content-Type":"application/json"},body:JSON.stringify({isActive:!isVenueActive(venue.isActive)})});const d=await r.json();if(!r.ok)throw new Error(errorText(d,"Unable to update venue state."));const updated=d.venue||d;setVenues(current=>current.map(item=>item.id===venue.id?{...item,...updated,isActive:isVenueActive(updated.isActive)}:item));}catch(e){setError(e.message);}};
  const publish=async venue=>{try{setError("");if(venue?.id==null)throw new Error("This venue is missing its ID and cannot be published.");const r=await apiFetch(`/api/admin/venues/${venue.id}/moderation`,{method:"PATCH",headers:{...auth(),"Content-Type":"application/json"},body:JSON.stringify({moderationStatus:"approved"})});const d=r.status===204?null:await r.json().catch(()=>({}));if(!r.ok)throw new Error(errorText(d,"Unable to publish venue."));const updated=d.venue||d;setVenues(current=>current.map(item=>item.id===venue.id?{...item,...updated,isActive:isVenueActive(updated.isActive)}:item));}catch(e){setError(e.message);}};
  return <Shell title={dashboardTitle}><div className="flex flex-wrap justify-between gap-4"><div><h1 className="font-display text-4xl font-bold">{dashboardTitle}</h1><p className="mt-2 text-muted-foreground">{isAdmin || isManager ? "Review all active and inactive venues." : "Create spaces and respond to event booking requests."}</p></div><Link to="/profile/venues/new" className="bg-primary px-5 py-3 text-sm text-primary-foreground">Add venue</Link></div>{error&&<Error text={error}/>} {loading?<Loading label="Loading venues…"/>:<><div className="mt-8 grid gap-4 md:grid-cols-2">{venues.map(v=>{const owner=v.owner||v.user||{};const ownerName=owner.name||v.ownerName||v.ownerEmail||"Not supplied";const active=isVenueActive(v.isActive);return <article key={v.id} className="border border-border p-5"><div className="flex justify-between gap-3"><h2 className="font-display text-2xl font-semibold">{v.name}</h2><div className="flex flex-wrap items-center gap-2"><ModerationStatus status={v.moderationStatus} /><Status status={active ? "active" : "inactive"}/></div></div><dl className="mt-4 grid gap-2 text-sm"><div><dt className="inline text-muted-foreground">Business: </dt><dd className="inline">{v.businessName||"Not supplied"}</dd></div><div><dt className="inline text-muted-foreground">Owner: </dt><dd className="inline">{ownerName}</dd></div><div><dt className="inline text-muted-foreground">Location: </dt><dd className="inline">{[v.location,v.address,v.city,v.country].filter(Boolean).join(", ")||"Not supplied"}</dd></div><div><dt className="inline text-muted-foreground">Timezone: </dt><dd className="inline">{v.timezone||"Not supplied"}</dd></div></dl><div className="mt-5 flex flex-wrap gap-2 text-sm"><Link className="border border-border px-4 py-2" to={`/venues/${v.id}`}>Venue details</Link><Link className="border border-border px-4 py-2" to={`/profile/venues/${v.id}/edit`}>Edit & availability</Link><Link className="border border-border px-4 py-2" to={`/profile/venues/${v.id}/bookings`}>Booking list</Link>{isAdmin&&v.moderationStatus!=="approved"&&<button type="button" onClick={()=>publish(v)} className="bg-primary px-4 py-2 text-primary-foreground">Publish</button>}{(isAdmin||isManager)&&<button type="button" onClick={()=>toggleActive(v)} className="border border-border px-4 py-2">{active?"Deactivate":"Activate"}</button>}<button type="button" onClick={()=>remove(v.id)} className="border border-destructive px-4 py-2 text-destructive">Delete</button></div></article>})}</div>{!venues.length&&!error&&<p className="mt-8 text-muted-foreground">{emptyMessage||"No venues found."}</p>}</>}</Shell>;
}

export function VenuesDiscoveryPage({ detail = false }) {
  const { id } = useParams(); const [venues, setVenues] = useState([]); const [venue, setVenue] = useState(null); const [error, setError] = useState(""); const [emptyMessage, setEmptyMessage] = useState("");
  useEffect(() => { const path = detail ? `/api/venues/${id}` : "/api/venues"; apiFetch(path).then(async r => { const d = await r.json(); if (r.status === 404 && !detail) { setVenues([]); setEmptyMessage(errorText(d, "No venues are available yet.")); return; } if (!r.ok) throw new Error(errorText(d, "Unable to load venues.")); detail ? setVenue(d.venue || d) : setVenues(list(d, "venues")); }).catch(e => setError(e.message)); }, [detail, id]);
  if (detail) return <Shell title={venue?.name || "Venue"}><Link to="/venues" className="text-sm text-primary underline">Back to venues</Link>{error && <Error text={error}/>} {venue && <article className="mt-6 max-w-2xl"><h1 className="font-display text-4xl font-bold">{venue.name}</h1>{venue.businessName && <p className="mt-2 text-muted-foreground">{venue.businessName}</p>}<p className="mt-6 leading-relaxed">{venue.description}</p><p className="mt-6 text-sm text-muted-foreground">{[venue.location, venue.address, venue.city, venue.country].filter(Boolean).join(", ")}</p></article>}</Shell>;
  return <Shell title="Discover venues"><h1 className="font-display text-4xl font-bold">Discover venues</h1><p className="mt-3 text-muted-foreground">Places available for community events.</p><p className="mt-4 border-l-2 border-amber-500 bg-amber-500/10 px-3 py-2 text-sm leading-relaxed">Public venue information is supplied by venue owners or businesses and may be visible to anyone, including search engines.</p>{error && <Error text={error}/>}<div className="mt-8 grid gap-4 md:grid-cols-2">{venues.map(v => <Link key={v.id} to={`/venues/${v.id}`} className="border border-border p-5 hover:border-primary"><h2 className="font-display text-2xl font-semibold">{v.name}</h2><p className="mt-2 text-sm text-muted-foreground">{[v.location, v.city, v.country].filter(Boolean).join(", ")}</p>{v.description && <p className="mt-3 line-clamp-2 text-sm">{v.description}</p>}</Link>)}</div>{!venues.length&&!error&&<p className="mt-8 text-muted-foreground">{emptyMessage||"No venues are available yet."}</p>}</Shell>;
}

export function VenueEditorPage() {
  const {id}=useParams(); const navigate=useNavigate(); const editing=Boolean(id); const [form,setForm]=useState(blankVenue); const [availability,setAvailability]=useState([]); const [error,setError]=useState(""); const [saving,setSaving]=useState(false);
  useEffect(()=>{if(!editing)return; apiFetch(`/api/venues/${id}`,{headers:auth()}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(errorText(d,"Unable to load venue."));const v=d.venue||d;setForm({...blankVenue,...v,latitude:v.latitude??"",longitude:v.longitude??"",isActive:isVenueActive(v.isActive)});setAvailability(v.availability||[]);}).catch(e=>setError(e.message));},[id,editing]);
  const save=async e=>{e.preventDefault();setSaving(true);setError("");try{const payload={...form,isActive:isVenueActive(form.isActive),latitude:form.latitude===""?undefined:Number(form.latitude),longitude:form.longitude===""?undefined:Number(form.longitude)};const r=await apiFetch(editing?`/api/venues/${id}`:"/api/venues",{method:editing?"PATCH":"POST",headers:{...auth(),"Content-Type":"application/json"},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)throw new Error(errorText(d,"Unable to save venue."));const venue=d.venue||d;const venueId=venue.id||id;if(editing){const a=await apiFetch(`/api/venues/${venueId}/availability`,{method:"PUT",headers:{...auth(),"Content-Type":"application/json"},body:JSON.stringify({availability})});const ad=await a.json();if(!a.ok)throw new Error(errorText(ad,"Venue saved, but schedule could not be saved."));}navigate(`/profile/venues/${venueId}/edit`);}catch(e){setError(e.message);}finally{setSaving(false)}};
  const setSlot=(index,key,value)=>setAvailability(a=>a.map((x,i)=>i===index?{...x,[key]:value}:x));
  return <Shell title={editing?"Edit venue":"Add venue"}><Link to="/profile/venues" className="text-sm text-primary underline">Back to my venues</Link><h1 className="mt-5 font-display text-4xl font-bold">{editing?"Edit venue":"Add a venue"}</h1>{error&&<Error text={error}/>}<form onSubmit={save} className="mt-8 grid max-w-3xl gap-5 sm:grid-cols-2"><Field label="Venue name" required value={form.name} onChange={v=>setForm({...form,name:v})}/><Field label="Business name" value={form.businessName||""} onChange={v=>setForm({...form,businessName:v})}/><label className="sm:col-span-2 text-sm font-medium">Description<textarea value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} className="mt-2 min-h-28 w-full border border-border bg-background p-3"/></label>{[["location","Location"],["country","Country"],["city","City"],["address","Address"],["latitude","Latitude"],["longitude","Longitude"],["timezone","Timezone"]].map(([key,label])=><Field key={key} label={label} required={["location","country","city","address","timezone"].includes(key)} value={form[key]||""} onChange={v=>setForm({...form,[key]:v})}/>) }<label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={isVenueActive(form.isActive)} onChange={e=>setForm({...form,isActive:e.target.checked})}/> Active and available for bookings</label>{editing&&<section className="sm:col-span-2 border-t border-border pt-7"><h2 className="font-display text-2xl font-semibold">Weekly availability</h2><p className="mt-1 text-sm text-muted-foreground">Times use your venue timezone. Sunday is weekday 0.</p><div className="mt-4 space-y-3">{availability.map((slot,i)=><div key={i} className="flex flex-wrap items-end gap-3"><label className="text-sm">Day<select value={slot.weekday} onChange={e=>setSlot(i,"weekday",Number(e.target.value))} className="ml-2 border border-border bg-background p-2">{days.map((d,n)=><option key={d} value={n}>{d}</option>)}</select></label><label className="text-sm">Start<input type="time" value={slot.startTime} onChange={e=>setSlot(i,"startTime",e.target.value)} className="ml-2 border border-border p-2"/></label><label className="text-sm">End<input type="time" value={slot.endTime} onChange={e=>setSlot(i,"endTime",e.target.value)} className="ml-2 border border-border p-2"/></label><button type="button" onClick={()=>setAvailability(a=>a.filter((_,x)=>x!==i))} className="text-sm text-destructive">Remove</button></div>)}</div><button type="button" onClick={()=>setAvailability(a=>[...a,{weekday:0,startTime:"09:00",endTime:"17:00"}])} className="mt-4 border border-border px-4 py-2 text-sm">Add time slot</button></section>}<button disabled={saving} className="sm:col-span-2 justify-self-start bg-primary px-5 py-3 text-sm text-primary-foreground disabled:opacity-60">{saving?"Saving…":"Save venue"}</button></form></Shell>;
}

export function VenueBookingsPage() {
  const { id } = useParams();
  const [bookings, setBookings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [ownerNote, setOwnerNote] = useState("");
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
      if (!response.ok) throw new Error(errorText(data, "Unable to update booking."));
      setReviewing(null);
      load();
    } catch (requestError) {
      setNotification(requestError.message);
    }
  };

  return <Shell title="Venue requests">
    <Link to="/profile/venues" className="text-sm text-primary underline">Back to my venues</Link>
    <h1 className="mt-5 font-display text-4xl font-bold">Venue requests</h1>
    <p className="mt-3 max-w-2xl text-muted-foreground">Direct venue inquiries and event bookings are separate request types. Both are shown below.</p>
    {error && <Error text={error} />}
    {loading ? <Loading label="Loading booking requests…" /> : <div className="mt-8 space-y-3">
      <section className="border-b border-border pb-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3"><h2 className="font-display text-2xl font-semibold">Venue inquiries</h2><p className="text-sm text-muted-foreground">{inquiries.length} request{inquiries.length === 1 ? "" : "s"}</p></div>
        <p className="mt-2 text-sm text-muted-foreground">Requests sent through the “Request venue” form.</p>
        <div className="mt-5 space-y-3">{inquiries.map((inquiry) => <article key={inquiry.id} className="border border-border p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-semibold">{inquiry.eventName || inquiry.title || "Venue inquiry"}</h3><p className="mt-1 text-sm text-muted-foreground">{inquiry.requestedDate ? new Date(inquiry.requestedDate).toLocaleDateString() : "Date not supplied"}{inquiry.startTime && ` · ${inquiry.startTime}`}{inquiry.endTime && `–${inquiry.endTime}`}</p>{(inquiry.expectedGuests || inquiry.budget) && <p className="mt-1 text-sm text-muted-foreground">{inquiry.expectedGuests ? `${inquiry.expectedGuests} guests` : ""}{inquiry.expectedGuests && inquiry.budget ? " · " : ""}{inquiry.budget ? `Budget: ${inquiry.budget} SEK` : ""}</p>}<p className="mt-3 text-sm">From {inquiry.requesterName || inquiry.user?.name || inquiry.contactName || "Guest"}{(inquiry.requesterEmail || inquiry.user?.email || inquiry.email) && ` · ${inquiry.requesterEmail || inquiry.user?.email || inquiry.email}`}</p>{inquiry.message && <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{inquiry.message}</p>}</div><Status status={inquiry.status || "new"} /></div></article>)}{!inquiries.length && <p className="text-sm text-muted-foreground">No venue inquiries yet.</p>}</div>
      </section>
      <section className="pt-2">
        <div className="flex flex-wrap items-baseline justify-between gap-3"><h2 className="font-display text-2xl font-semibold">Event bookings</h2><p className="text-sm text-muted-foreground">{bookings.length} booking{bookings.length === 1 ? "" : "s"}</p></div>
        <p className="mt-2 text-sm text-muted-foreground">Bookings created from an event’s venue-booking flow.</p>
        <div className="mt-5 space-y-3">
      {bookings.map((booking) => <div key={booking.id} className="border border-border p-5">
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
          </div>
          <Status status={booking.status} />
        </div>
        {["requested", "pending"].includes(booking.status) && <div className="mt-4 flex gap-2">
          <button onClick={() => openReview(booking, "confirmed")} className="bg-primary px-4 py-2 text-sm text-primary-foreground">Confirm</button>
          <button onClick={() => openReview(booking, "declined")} className="border border-border px-4 py-2 text-sm">Decline</button>
        </div>}
        <VenueBookingConversation bookingId={booking.id} />
      </div>)}
      {!bookings.length && <p className="text-sm text-muted-foreground">No event bookings yet.</p>}
        </div>
      </section>
    </div>}
    {reviewing && <div role="dialog" aria-modal="true" aria-labelledby="venue-booking-review-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">
      <form onSubmit={review} className="w-full max-w-lg border border-border bg-background p-6 shadow-xl">
        <h2 id="venue-booking-review-title" className="font-display text-2xl font-semibold">{reviewing.status === "confirmed" ? "Confirm venue booking" : "Decline venue booking"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{reviewing.booking.eventTitle || "This event"} will be {reviewing.status === "confirmed" ? "confirmed and invoiced" : "declined"}.</p>
        <label className="mt-5 block text-sm font-medium">Optional note to event owner<textarea autoFocus value={ownerNote} onChange={(event) => setOwnerNote(event.target.value)} maxLength="5000" className="mt-2 min-h-28 w-full border border-border bg-background p-3" /></label>
        <div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setReviewing(null)} className="border border-border px-4 py-2 text-sm">Cancel</button><button className={reviewing.status === "confirmed" ? "bg-primary px-4 py-2 text-sm text-primary-foreground" : "border border-destructive px-4 py-2 text-sm text-destructive"}>{reviewing.status === "confirmed" ? "Confirm booking" : "Decline booking"}</button></div>
      </form>
    </div>}
    {notification && <p role="alert" className="fixed bottom-6 left-5 z-[60] max-w-md border border-destructive/30 bg-background px-4 py-3 text-sm text-destructive shadow-lg sm:left-auto sm:right-6">{notification}</p>}
  </Shell>;
}

function Shell({title,children}){return <SiteChrome><Helmet><title>{title} | YKCircle</title></Helmet><section className="mx-auto max-w-[72rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40">{children}</section></SiteChrome>}; function Loading({label="Loading…"}){return <p role="status" className="mt-8 text-muted-foreground">{label}</p>}; function Field({label,required,value,onChange}){return <label className="block text-sm font-medium">{label}{required&&" *"}<input required={required} value={value} onChange={e=>onChange(e.target.value)} className="mt-2 min-h-11 w-full border border-border bg-background px-3"/></label>}; function Error({text}){return <p role="alert" className="mt-5 border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{text}</p>}; function Status({status}){return <span className="whitespace-nowrap text-sm capitalize text-primary">{status||"pending"}</span>};
const moderationLabels={draft:"Draft",pending:"Pending review",approved:"Published",rejected:"Rejected",removed:"Removed"};
const moderationStyles={approved:"border-primary text-primary",rejected:"border-destructive text-destructive",removed:"border-destructive text-destructive"};
function ModerationStatus({status}){const value=status||"draft";return <span className={`whitespace-nowrap border px-2 py-1 text-xs font-semibold uppercase tracking-wider ${moderationStyles[value]||"border-border text-muted-foreground"}`}>{moderationLabels[value]||value}</span>}; function StatusCard({item,label}){return <div className="mt-8 max-w-xl border border-border p-6"><div className="flex justify-between gap-3"><div><p className="font-semibold">{item.businessName}</p><p className="mt-2 text-sm text-muted-foreground">{item.message}</p></div><Status status={item.status}/></div><p className="mt-4 text-sm text-muted-foreground">{label} received. We will notify you when it has been reviewed.</p></div>}
