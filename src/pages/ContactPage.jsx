import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import SiteChrome from '@/components/SiteChrome';
import { apiFetch } from '@/lib/api';

const initialForm = { name: '', email: '', category: 'General', message: '' };

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ loading: false, error: '', reference: '' });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setStatus({ loading: true, error: '', reference: '' });
    try {
      const token = localStorage.getItem('authToken');
      const response = await apiFetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to send your message.');
      setStatus({ loading: false, error: '', reference: data.reference || '' });
      setForm(initialForm);
    } catch (error) { setStatus({ loading: false, error: error.message, reference: '' }); }
  };
  return <SiteChrome><Helmet><title>Contact YKCircle</title><meta name="robots" content="noindex" /></Helmet><section className="mx-auto max-w-[42rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">Get in touch</p><h1 className="mt-4 font-display text-5xl font-black leading-[0.95]">How can we help?</h1><p className="mt-6 leading-relaxed text-muted-foreground">Choose Privacy for data-rights requests, Account for account help, or Safety to flag an urgent safety concern. Privacy requests receive a reference number.</p>{status.reference ? <div className="rounded-2xl mt-10 border border-primary bg-primary/5 p-6" role="status"><h2 className="font-display text-3xl">Message received</h2><p className="mt-3 text-muted-foreground">Keep this reference for follow-up: <span className="font-mono text-foreground">{status.reference}</span></p><button type="button" onClick={() => setStatus({ loading: false, error: '', reference: '' })} className="mt-5 text-sm text-primary underline">Send another message</button></div> : <form onSubmit={submit} className="mt-10 space-y-6"><label className="block text-sm">Name<input required name="name" value={form.name} onChange={update} className="mt-2 min-h-12 w-full border border-border bg-background px-4" /></label><label className="block text-sm">Email<input required type="email" name="email" value={form.email} onChange={update} className="mt-2 min-h-12 w-full border border-border bg-background px-4" /></label><label className="block text-sm">Category<select name="category" value={form.category} onChange={update} className="mt-2 min-h-12 w-full border border-border bg-background px-4"><option>General</option><option>Privacy</option><option>Account</option><option>Safety</option><option>Other</option></select></label><label className="block text-sm">Message<textarea required maxLength="10000" name="message" value={form.message} onChange={update} rows="7" className="mt-2 w-full border border-border bg-background px-4 py-3" /></label>{status.error && <p role="alert" className="text-sm text-destructive">{status.error}</p>}<button disabled={status.loading} className="ui-action min-h-12 bg-primary px-7 text-sm font-medium uppercase tracking-widest text-primary-foreground disabled:opacity-60">{status.loading ? 'Sending…' : 'Send message'}</button></form>}</section></SiteChrome>;
}
