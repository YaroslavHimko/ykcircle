import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import SiteChrome from '@/components/SiteChrome';
import { apiFetch } from '@/lib/api';

export default function AppealPage() {
  const navigate = useNavigate();
  const [decisionId, setDecisionId] = useState('');
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem('authToken');
  const submit = async (event) => {
    event.preventDefault();
    if (!token) { navigate('/login?from=%2Fappeal'); return; }
    setSaving(true); setError('');
    try {
      const response = await apiFetch('/api/appeals', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ moderationDecisionId: Number(decisionId), explanation }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to submit your appeal.');
      setSubmitted(true);
    } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };
  return <SiteChrome><Helmet><title>Appeal a moderation decision | YKCircle</title><meta name="robots" content="noindex" /></Helmet><section className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><p className="text-xs uppercase tracking-[0.3em] text-primary">Moderation</p><h1 className="mt-3 font-display text-5xl font-black">Appeal a decision</h1><p className="mt-5 leading-relaxed text-muted-foreground">Use the decision ID in the moderation notice you received. Appeals are available only to the affected signed-in member.</p>{submitted ? <div className="rounded-2xl mt-10 border border-primary bg-primary/5 p-6" role="status"><h2 className="font-display text-3xl">Appeal submitted</h2><p className="mt-3 text-muted-foreground">Your appeal is now under review.</p></div> : <form onSubmit={submit} className="mt-10 space-y-6"><label className="block text-sm">Moderation decision ID<input required min="1" type="number" value={decisionId} onChange={(event) => setDecisionId(event.target.value)} className="mt-2 min-h-12 w-full border border-border bg-background px-4" /></label><label className="block text-sm">Why should this decision be reviewed?<textarea required maxLength="5000" value={explanation} onChange={(event) => setExplanation(event.target.value)} rows="7" className="mt-2 w-full border border-border bg-background px-4 py-3" /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<button disabled={saving} className="ui-action min-h-12 bg-primary px-7 text-sm uppercase tracking-widest text-primary-foreground disabled:opacity-60">{saving ? 'Submitting…' : token ? 'Submit appeal' : 'Log in to appeal'}</button></form>}</section></SiteChrome>;
}
