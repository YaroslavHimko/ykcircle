import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("authToken")}` });
const asList = (value) => Array.isArray(value) ? value : value?.messages || [];

export default function VenueBookingConversation({ bookingId }) {
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const load = async () => { const response = await apiFetch(`/api/venue-bookings/${bookingId}/messages`, { headers: auth() }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load private messages."); setMessages(asList(data)); };
  useEffect(() => { if (open) load().catch((requestError) => setError(requestError.message)); }, [bookingId, open]);
  const send = async (event) => { event.preventDefault(); const message = body.trim(); if (!message) return; setSending(true); setError(""); try { const response = await apiFetch(`/api/venue-bookings/${bookingId}/messages`, { method: "POST", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify({ body: message }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to send private message."); setBody(""); await load(); } catch (requestError) { setError(requestError.message); } finally { setSending(false); } };
  return <section className="mt-5 border-t border-border pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Private conversation</h3><p className="mt-1 text-sm text-muted-foreground">Only the event organizer and authorized venue team members can read these messages.</p></div><button type="button" aria-expanded={open} onClick={() => { setError(""); setOpen((value) => !value); }} className="ui-action border border-border px-4 py-2 text-sm">{open ? "Hide messages" : "View messages"}</button></div>{open && <>{error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}<div className="rounded-2xl mt-4 max-h-64 space-y-3 overflow-y-auto border border-border p-3">{messages.map((message) => <article key={message.id} className="text-sm"><p className="font-medium">{message.senderName || "Member"}</p><p className="mt-1 whitespace-pre-wrap">{message.body}</p><time className="mt-1 block text-xs text-muted-foreground">{message.createdAt ? new Date(message.createdAt).toLocaleString() : ""}</time></article>)}{!messages.length && <p className="text-sm text-muted-foreground">No messages yet.</p>}</div><form onSubmit={send} className="mt-4"><label className="block text-sm font-medium">Message<textarea required value={body} onChange={(event) => setBody(event.target.value)} maxLength="5000" className="mt-2 min-h-24 w-full border border-border bg-background p-3" /></label><button disabled={sending} className="ui-action mt-3 bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">{sending ? "Sending…" : "Send message"}</button></form></>}</section>;
}
