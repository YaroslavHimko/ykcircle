import React, { useEffect, useState } from "react";
import { MessageCircle, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";

const list = (value, key) => Array.isArray(value) ? value : value?.[key] || [];

const communityAvailabilityMessages = {
  COMMUNITY_POST_FULFILLED: "Discussions are closed because this community post is completed.",
  COMMUNITY_POST_EXPIRED: "Discussions are closed because this community post has expired.",
  COMMUNITY_POST_NOT_PUBLIC: "Discussions are unavailable because this community post is not public.",
  COMMUNITY_POST_NON_PUBLIC: "Discussions are unavailable because this community post is not public.",
  COMMUNITY_POST_INACTIVE: "Discussions are unavailable because this community post is no longer active.",
  COMMUNITY_POST_NOT_FOUND: "Discussions are unavailable because this community post no longer exists.",
  COMMUNITY_POST_MISSING: "Discussions are unavailable because this community post no longer exists.",
};

const unavailableMessage = (reason) =>
  communityAvailabilityMessages[reason.code] || reason.message;

function UnreadBadge({ count }) {
  return Number(count) > 0 ? (
    <span aria-label={`${count} unread messages`} className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-bold text-primary-foreground">
      {count}
    </span>
  ) : null;
}

export default function ForumDiscussion({ title = "Discussion", basePath, token, canPost = false, canModerate = false, emptyText = "No discussion threads yet.", unavailableReason = "" }) {
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState({ title: "", body: "" });
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(unavailableReason);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const request = async (path, options = {}) => {
    const response = await apiFetch(path, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "Unable to update the discussion.");
      error.code = data.code;
      throw error;
    }
    return data;
  };
  const loadThreads = async () => {
    setLoading(true); setError(""); setUnavailable("");
    try { setThreads(list(await request(basePath, { headers }), "threads")); } catch (reason) {
      if (reason.code?.startsWith("COMMUNITY_POST_")) setUnavailable(unavailableMessage(reason));
      else setError(reason.message);
    } finally { setLoading(false); }
  };
  const loadMessages = async (thread) => {
    setSelected(thread); setMessages([]); setError("");
    try {
      setMessages(list(await request(`${basePath}/${thread.id}/messages`, { headers }), "messages"));
      setThreads((current) => current.map((item) => item.id === thread.id ? { ...item, unreadCount: 0 } : item));
      setSelected((current) => current?.id === thread.id ? { ...current, unreadCount: 0 } : current);
    } catch (reason) { setError(reason.message); }
  };
  useEffect(() => {
    if (unavailableReason) {
      setUnavailable(unavailableReason);
      setLoading(false);
      return;
    }
    loadThreads();
  }, [basePath, token, unavailableReason]);
  const createThread = async (event) => {
    event.preventDefault();
    try {
      const thread = await request(basePath, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setForm({ title: "", body: "" });
      await loadThreads();
      await loadMessages(thread);
    } catch (reason) { setError(reason.message); }
  };
  const sendReply = async (event) => {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    try {
      await request(`${basePath}/${selected.id}/messages`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ body: reply }) });
      setReply(""); await loadMessages(selected);
    } catch (reason) { setError(reason.message); }
  };
  const moderate = async (thread, status) => {
    try {
      await request(`${basePath}/${thread.id}`, { method: "PATCH", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      setThreads((current) => current.map((item) => item.id === thread.id ? { ...item, status } : item));
      if (status === "removed" && selected?.id === thread.id) { setSelected(null); setMessages([]); }
    } catch (reason) { setError(reason.message); }
  };

  return <section className="mt-12 border-t border-border pt-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.25em] text-primary">Community forum</p><h2 className="mt-2 font-display text-3xl font-semibold">{title}</h2></div><MessageCircle className="h-6 w-6 text-primary" /></div>{unavailable ? <p className="mt-5 border border-border bg-secondary/35 p-4 text-sm text-muted-foreground">{unavailable}</p> : <>{error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}{canPost && <form onSubmit={createThread} className="mt-6 grid gap-3 border border-border p-4"><input required minLength="3" maxLength="180" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Start a discussion" className="min-h-11 border border-border bg-background px-3" /><textarea required maxLength="4000" rows="3" value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} placeholder="Share your question or idea" className="border border-border bg-background px-3 py-2" /><button className="inline-flex min-h-10 w-fit items-center gap-2 bg-primary px-4 text-sm text-primary-foreground"><Plus className="h-4 w-4" />Post thread</button></form>}{!canPost && <p className="mt-5 text-sm text-muted-foreground">Sign in and join this space to start a discussion.</p>}<div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]"><div className="divide-y divide-border border-y border-border">{loading ? <p className="py-5 text-sm text-muted-foreground">Loading discussions…</p> : threads.length ? threads.filter((thread) => thread.status !== "removed").map((thread) => <article key={thread.id} className={`py-4 ${selected?.id === thread.id ? "bg-secondary/35 px-3" : ""}`}><button type="button" onClick={() => loadMessages(thread)} className="w-full text-left"><div className="flex items-center justify-between gap-3"><p className="font-medium">{thread.title}</p><UnreadBadge count={thread.unreadCount} /></div><p className="mt-1 text-xs text-muted-foreground">{thread.authorName || "Community member"} · {thread.status}</p></button>{canModerate && <div className="mt-3 flex gap-2 text-xs"><button type="button" onClick={() => moderate(thread, thread.status === "locked" ? "active" : "locked")} className="text-primary">{thread.status === "locked" ? "Reopen" : "Lock"}</button><button type="button" onClick={() => moderate(thread, "removed")} className="text-destructive">Remove</button></div>}</article>) : <p className="py-5 text-sm text-muted-foreground">{emptyText}</p>}</div><div className="border border-border p-4">{selected ? <><h3 className="font-display text-2xl">{selected.title}</h3><div className="mt-4 max-h-80 space-y-3 overflow-y-auto">{messages.map((message) => <div key={message.id} className="bg-secondary/35 p-3 text-sm"><p className="font-medium">{message.authorName || message.senderName || "Community member"}</p><p className="mt-1 whitespace-pre-wrap">{message.body}</p></div>)}</div>{selected.status === "active" && canPost && <form onSubmit={sendReply} className="mt-4 flex gap-2"><input required maxLength="4000" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a reply" className="min-h-10 min-w-0 flex-1 border border-border bg-background px-3 text-sm" /><button className="bg-primary px-4 text-sm text-primary-foreground">Send</button></form>}{selected.status !== "active" && <p className="mt-4 text-sm text-muted-foreground">This thread is locked.</p>}</> : <p className="text-sm text-muted-foreground">Select a thread to read the conversation.</p>}</div></div></>}</section>;
}
