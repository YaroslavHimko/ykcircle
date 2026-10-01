import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SiteChrome from '@/components/SiteChrome';
import { apiFetch } from '@/lib/api';

export async function subscriptionRequest(path, body, method = 'POST') {
  const response = await apiFetch(path, { method: body === undefined ? 'GET' : method, headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to complete this request.');
  return data;
}
export const fieldClass = 'mt-2 min-h-11 w-full min-w-0 border border-border bg-background px-3';
export const buttonClass = 'inline-flex min-h-11 items-center justify-center bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50';
export const dateLabel = (value) => value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';
export function SubscriptionShell({ title, children }) {
  return <SiteChrome><section className="mx-auto max-w-5xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><h1 className="font-display text-4xl font-bold">{title}</h1>{children}</section></SiteChrome>;
}
function openBilling(url) {
  const target = new URL(url);
  if (target.protocol !== 'https:' || !(target.hostname === 'stripe.com' || target.hostname.endsWith('.stripe.com'))) throw new Error('The billing link is invalid. Please retry.');
  window.location.assign(target.href);
}
export default function SubscriptionsPage() {
  const [params, setParams] = useSearchParams();
  const user = JSON.parse(localStorage.getItem('authUser') || 'null');
  const owner = { type: params.get('ownerType') || 'user', id: Number(params.get('ownerId') || user?.id) };
  const returnTo = /^\/profile\/events(?:\/[1-9]\d*\/edit)?$/.test(params.get('returnTo') || '') ? params.get('returnTo') : '/profile/events';
  const query = `ownerType=${encodeURIComponent(owner.type)}&ownerId=${owner.id}`;
  const [options, setOptions] = useState(null), [summary, setSummary] = useState(null), [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [polling, setPolling] = useState(false);
  const returning = params.get('checkout') === 'success';
  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    subscriptionRequest('/api/subscriptions/options').then((next) => { if (alive) { setOptions(next); setProfiles(next.billingProfiles || []); } }).catch((failure) => alive && setError(failure.message));
    return () => { alive = false; };
  }, [user?.id]);
  useEffect(() => {
    if (!user?.id) return;
    let alive = true, timer, attempts = 0;
    setSummary(null); setProfileId(''); setError(''); setPolling(returning);
    const load = async () => {
      try {
        const data = await subscriptionRequest(`/api/subscriptions/me?${query}`);
        if (!alive) return;
        setSummary(data);
        const activated = data.entitlements.some((entry) => entry.feature === 'organizer.publish_event' && entry.source === 'subscription');
        if (returning && !activated && ++attempts < 15) timer = window.setTimeout(load, 2000);
        else setPolling(false);
      } catch (failure) { if (alive) { setPolling(false); setError(failure.message); } }
    };
    load();
    return () => { alive = false; window.clearTimeout(timer); };
  }, [query, returning, user?.id]);
  const run = async (action) => { setBusy(true); setError(''); try { await action(); } catch (failure) { setError(failure.message); } finally { setBusy(false); } };
  const matchingProfiles = profiles.filter((profile) => owner.type === 'organization' ? Number(profile.ownerOrganizationId) === owner.id : !profile.ownerOrganizationId && Number(profile.ownerUserId) === owner.id);
  const existing = summary?.subscriptions.some((entry) => ['active','trialing','past_due','unpaid','paused','incomplete'].includes(entry.status));
  if (!user) return <SubscriptionShell title="Subscriptions"><Link to="/login?from=%2Fprofile%2Fsubscriptions" className="mt-6 inline-block text-primary underline">Log in to view your subscriptions</Link></SubscriptionShell>;
  return <SubscriptionShell title="Subscriptions">
    <p className="mt-4 max-w-2xl text-muted-foreground">Manage publishing access for your personal account or organization. You can create and edit drafts at any time.</p>
    {error && <p role="alert" className="mt-5 text-destructive">{error}</p>}
    {!summary && !error && <p role="status" className="mt-6">Loading subscription…</p>}
    {options && <label className="mt-6 block max-w-md text-sm">Organizing account<select className={fieldClass} value={`${owner.type}:${owner.id}`} onChange={(event) => { const [type,id] = event.target.value.split(':'); setParams({ ownerType: type, ownerId: id, returnTo }); }}>
      {options.owners.map((entry) => <option key={`${entry.type}:${entry.id}`} value={`${entry.type}:${entry.id}`}>{entry.name}</option>)}
    </select></label>}
    {summary && <>
      <section className="mt-6 border border-border bg-secondary/30 p-5" aria-live="polite">
        <h2 className="text-xl font-semibold">{summary.canPublish ? 'Publishing access enabled' : 'Subscribe to publish events'}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{!summary.subscriptionsEnabled ? 'Early access: no subscription is currently required to publish.' : summary.canPublish ? `Access source: ${summary.accessSource?.replaceAll('_', ' ')}.` : 'Your drafts are saved. An active organizer subscription is required when you publish.'}</p>
        {polling && <p role="status" className="mt-3 text-sm">Confirming your subscription. This can take a few moments…</p>}
        {returning && !polling && !summary.entitlements.some((entry) => entry.source === 'subscription') && <p className="mt-3 text-sm">Activation has not arrived yet. Refresh this page shortly. Please don’t purchase another subscription.</p>}
        {params.get('checkout') === 'cancelled' && <p className="mt-3 text-sm">Checkout was cancelled. Your draft is still available.</p>}
        <Link to={returnTo} className="mt-4 inline-block text-sm text-primary underline">{summary.canPublish ? 'Return to your event' : 'Continue editing drafts'}</Link>
      </section>
      <section className="mt-8"><h2 className="font-display text-2xl font-semibold">Your subscriptions</h2>
        {!summary.subscriptions.length && <p className="mt-3 text-sm text-muted-foreground">No subscriptions for this account.</p>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">{summary.subscriptions.map((subscription) => <article key={subscription.id} className="min-w-0 border border-border p-5">
          <h3 className="text-lg font-semibold">{subscription.planName}</h3><p className="mt-2 text-sm capitalize">{subscription.status.replaceAll('_',' ')}</p>
          <p className="mt-2 text-sm text-muted-foreground">{subscription.cancelAtPeriodEnd ? 'Ends on' : 'Current period ends'} {dateLabel(subscription.currentPeriodEnd)}</p>
          {['active','trialing','past_due'].includes(subscription.status) && !subscription.cancelAtPeriodEnd && <button disabled={busy} className="mt-4 text-sm text-primary underline" onClick={() => { if (window.confirm('Cancel renewal at the end of the current billing period?')) run(async () => { await subscriptionRequest(`/api/subscriptions/${subscription.id}/cancel`, { owner }); setSummary(await subscriptionRequest(`/api/subscriptions/me?${query}`)); }); }}>Cancel renewal</button>}
        </article>)}</div>
        {!!summary.subscriptions.length && <button disabled={busy} className={`${buttonClass} mt-5`} onClick={() => run(async () => openBilling((await subscriptionRequest('/api/subscriptions/portal', { owner })).url))}>Manage billing and invoices</button>}
      </section>
      {summary.subscriptionsEnabled && !existing && !returning && <section className="mt-8"><h2 className="font-display text-2xl font-semibold">Choose a plan</h2>
        <label className="mt-4 block max-w-md text-sm">Billing profile<select value={profileId} onChange={(event) => setProfileId(event.target.value)} className={fieldClass}><option value="">Choose a billing profile</option>{matchingProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.legalName}</option>)}</select></label>
        {!matchingProfiles.length && <Link to="/account/billing" className="mt-3 inline-block text-sm text-primary underline">Add a billing profile for this account</Link>}
        {!options?.plans.length && <p className="mt-4 text-sm text-muted-foreground">Subscription plans are being configured. You can continue working on drafts.</p>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">{options?.plans.map((plan) => <article key={plan.priceId} className="min-w-0 border border-border p-5"><h3 className="text-xl font-semibold">{plan.name}</h3><p className="mt-2 text-sm text-muted-foreground">{plan.description || 'Publish events with this organizing account.'}</p><p className="mt-4 text-2xl font-semibold">{new Intl.NumberFormat(undefined,{style:'currency',currency:plan.currency}).format(Number(plan.amount))}<span className="text-sm font-normal"> / {plan.billingInterval}</span></p><p className="mt-2 text-xs text-muted-foreground">Renews automatically. Cancel renewal at any time.</p><button className={`${buttonClass} mt-5`} disabled={busy || !profileId} onClick={() => run(async () => openBilling((await subscriptionRequest('/api/subscriptions/checkout', { owner, priceId: plan.priceId, billingProfileId: Number(profileId), returnTo })).checkoutUrl))}>{busy ? 'Opening checkout…' : 'Subscribe'}</button></article>)}</div>
      </section>}
      {!!summary.invoices.length && <section className="mt-8"><h2 className="text-xl font-semibold">Subscription invoices</h2><ul className="mt-4 space-y-3">{summary.invoices.map((invoice) => <li className="flex flex-wrap justify-between gap-2 border-b border-border py-3 text-sm" key={invoice.id}><span className="break-all">{invoice.id} · {invoice.status}</span>{invoice.hostedInvoiceUrl && <a className="text-primary underline" href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer">View invoice</a>}</li>)}</ul></section>}
    </>}
  </SubscriptionShell>;
}
