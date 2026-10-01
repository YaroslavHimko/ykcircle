import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import SiteChrome from '@/components/SiteChrome';
import { apiFetch } from '@/lib/api';

export default function AdminContactMessagesPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('authUser') || 'null');
    if (!token || !user) { navigate('/login?from=%2Fadmin%2Fcontact-messages', { replace: true }); return; }
    if (!['admin', 'manager'].includes(user.role)) { navigate('/profile', { replace: true }); return; }
    let active = true;
    apiFetch('/api/admin/contact-messages', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load contact messages.');
        if (active) setMessages(Array.isArray(data) ? data : []);
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate]);

  return <SiteChrome><Helmet><title>Contact messages | YKCircle</title><meta name="robots" content="noindex" /></Helmet>
    <section className="mx-auto max-w-4xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
      <p className="text-xs uppercase tracking-[0.25em] text-primary">Administration</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Contact messages</h1>
      <p className="mt-3 text-sm text-muted-foreground">Messages sent through the Contact Us form.</p>
      {loading && <p className="mt-8 text-muted-foreground">Loading messages…</p>}
      {error && <p role="alert" className="mt-8 text-destructive">{error}</p>}
      {!loading && !error && messages.length === 0 && <p className="mt-8 text-muted-foreground">No contact messages yet.</p>}
      <div className="mt-8 space-y-4">{messages.map((message) => <article key={message.id} className="min-w-0 border border-border p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><h2 className="font-display text-xl font-semibold">{message.name}</h2><a href={`mailto:${message.email}`} className="break-all text-sm text-primary underline">{message.email}</a></div>
          <span className="border border-border px-3 py-1 text-xs">{message.category}</span>
        </div>
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed">{message.message}</p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          <span>Reference: {message.reference}</span>
          <span>{new Date(message.createdAt).toLocaleString()}</span>
          <span>Status: {message.status?.replaceAll('_', ' ')}</span>
        </div>
      </article>)}</div>
    </section>
  </SiteChrome>;
}
