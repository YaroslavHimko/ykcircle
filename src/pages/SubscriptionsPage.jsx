import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CreditCard, LockKeyhole } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import BusinessIdentitySelector from '@/components/billing/BusinessIdentitySelector';
import { formatMoney, subscriptionStatus } from '@/lib/payments';
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
export function SubscriptionShell({ title, children, embedded = false }) {
  if (embedded) return <div>{children}</div>;
  return <SiteChrome><section className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14"><h1 className="font-display text-4xl font-bold">{title}</h1>{children}</section></SiteChrome>;
}
function openBilling(url) {
  const target = new URL(url);
  if (target.protocol !== 'https:' || !(target.hostname === 'stripe.com' || target.hostname.endsWith('.stripe.com'))) throw new Error('The billing link is invalid. Please retry.');
  window.location.assign(target.href);
}
export default function SubscriptionsPage({ embedded = false }) {
  const [params, setParams] = useSearchParams();
  const user = JSON.parse(localStorage.getItem('authUser') || 'null');
  const feature = params.get('feature') === 'author.publish_article' ? 'author.publish_article' : 'organizer.publish_event';
  const isArticle = feature === 'author.publish_article';
  const owner = { type: isArticle ? 'user' : params.get('ownerType') || 'user', id: Number(isArticle ? user?.id : params.get('ownerId') || user?.id) };
  const returnTo = /^(?:\/profile\/(?:events|articles)(?:\/[1-9]\d*\/edit)?|\/account\/payments(?:\/plan)?)$/.test(params.get('returnTo') || '') ? params.get('returnTo') : embedded ? '/account/payments' : isArticle ? '/profile/articles' : '/profile/events';
  const query = `feature=${feature}&ownerType=${encodeURIComponent(owner.type)}&ownerId=${owner.id}`;
  const [options, setOptions] = useState(null), [summary, setSummary] = useState(null), [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [polling, setPolling] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState('');
  const [checkoutStep, setCheckoutStep] = useState(0);
  const stepHeading = useRef(null);
  useEffect(() => { stepHeading.current?.focus(); }, [checkoutStep]);
  const returning = params.get('checkout') === 'success';
  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    setOptions(null); setProfiles([]);
    subscriptionRequest(`/api/subscriptions/options?feature=${feature}`).then((next) => { if (alive) { setOptions(next); setProfiles(next.billingProfiles || []); } }).catch((failure) => alive && setError(failure.message));
    return () => { alive = false; };
  }, [user?.id, feature]);
  useEffect(() => {
    if (!user?.id) return;
    let alive = true, timer, attempts = 0;
    setSummary(null); setProfileId(''); setSelectedPriceId(''); setCheckoutStep(0); setError(''); setPolling(returning);
    const load = async () => {
      try {
        const data = await subscriptionRequest(`/api/subscriptions/me?${query}`);
        if (!alive) return;
        setSummary(data);
        const activated = data.entitlements.some((entry) => entry.feature === feature && entry.source === 'subscription');
        if (returning && !activated && ++attempts < 15) timer = window.setTimeout(load, 2000);
        else setPolling(false);
      } catch (failure) { if (alive) { setPolling(false); setError(failure.message); } }
    };
    load();
    return () => { alive = false; window.clearTimeout(timer); };
  }, [query, returning, user?.id, feature]);
  const run = async (action) => { setBusy(true); setError(''); try { await action(); } catch (failure) { setError(failure.message); } finally { setBusy(false); } };
  const matchingProfiles = profiles.filter((profile) => owner.type === 'organization' ? Number(profile.ownerOrganizationId) === owner.id : !profile.ownerOrganizationId && Number(profile.ownerUserId) === owner.id);
  const selectedPlan = options?.plans.find(plan => String(plan.priceId) === selectedPriceId);
  const selectedProfile = matchingProfiles.find(profile => String(profile.id) === String(profileId));
  const existing = summary?.subscriptions.some((entry) => ['active','trialing','past_due','unpaid','paused','incomplete'].includes(entry.status));
  if (!user) return <SubscriptionShell title="Your plan" embedded={embedded}><Link to={`/login?from=${encodeURIComponent(`/profile/subscriptions?feature=${feature}&returnTo=${encodeURIComponent(returnTo)}`)}`} className="mt-6 inline-block text-primary underline">Log in to view your subscriptions</Link></SubscriptionShell>;
  return <SubscriptionShell title="Your plan" embedded={embedded}>
    <p className="mt-4 max-w-2xl text-muted-foreground">Manage your YKCircle plan and premium features. You can create and edit drafts at any time.</p>
    <div className="mt-5 flex flex-wrap gap-3" aria-label="Subscription type">{[['organizer.publish_event', 'Event publishing'], ['author.publish_article', 'Article space']].map(([value, label]) => <button key={value} type="button" aria-pressed={feature === value} onClick={() => { setOptions(null); setParams({ feature: value, returnTo }); }} className={`min-h-11 border px-4 text-sm ${feature === value ? 'border-primary text-primary' : 'border-border'}`}>{label}</button>)}</div>
    {error && <p role="alert" className="mt-5 text-destructive">{error}</p>}
    {!summary && !error && <p role="status" className="mt-6">Loading subscription…</p>}
    {options && !isArticle && <label className="mt-6 block max-w-md text-sm">Organizing account<select className={fieldClass} value={`${owner.type}:${owner.id}`} onChange={(event) => { const [type,id] = event.target.value.split(':'); setParams({ feature, ownerType: type, ownerId: id, returnTo }); }}>
      {options.owners.map((entry) => <option key={`${entry.type}:${entry.id}`} value={`${entry.type}:${entry.id}`}>{entry.name}</option>)}
    </select></label>}
    {summary && <>
      <section className="mt-6 border border-border bg-secondary/30 p-5" aria-live="polite">
        <h2 className="text-xl font-semibold">{isArticle ? summary.hasSubscription ? 'Your article space' : 'Subscribe to publish articles' : summary.canPublish ? 'Publishing access enabled' : 'Subscribe to publish events'}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{isArticle ? `${summary.remaining} of ${summary.monthlyLimit} article spaces remaining this month. Resets ${dateLabel(summary.resetsAt)} (UTC). An active article subscription is required to publish. Unused spaces do not roll over.` : !summary.subscriptionsEnabled ? "You’re using YKCircle during Early Access. Organizer features are currently free." : summary.canPublish ? 'Your plan includes Event publishing.' : 'Your drafts are saved. An active organizer subscription is required when you publish.'}</p>
        {polling && <p role="status" className="mt-3 text-sm">Confirming your subscription. This can take a few moments…</p>}
        {returning && !polling && !summary.entitlements.some((entry) => entry.feature === feature && entry.source === 'subscription') && <p className="mt-3 text-sm">Activation has not arrived yet. Refresh this page shortly. Please don’t purchase another subscription.</p>}
        {params.get('checkout') === 'cancelled' && <p className="mt-3 text-sm">Checkout was cancelled. Your draft is still available.</p>}
        <Link to={returnTo} className="mt-4 inline-block text-sm text-primary underline">{summary.canPublish ? 'Return to your drafts' : 'Continue editing drafts'}</Link>
      </section>
      {summary.subscriptions.length > 0 && <section className="mt-8"><h2 className="font-display text-2xl font-semibold">Your subscriptions</h2>
        {!summary.subscriptions.length && <p className="mt-3 text-sm text-muted-foreground">No subscriptions for this account.</p>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">{summary.subscriptions.map((subscription) => <article key={subscription.id} className="min-w-0 border border-border p-5">
          <h3 className="text-lg font-semibold">{subscription.planName}</h3>{subscription.amount != null && <p className="mt-2 text-sm">{formatMoney(subscription.amount, subscription.currency)} / {subscription.billingInterval}</p>}<p className="mt-2 text-sm capitalize">{subscriptionStatus(subscription)}</p>
          <p className="mt-2 text-sm text-muted-foreground">{subscription.cancelAtPeriodEnd ? 'Ends on' : 'Current period ends'} {dateLabel(subscription.currentPeriodEnd)}</p>
          {['active','trialing','past_due'].includes(subscription.status) && !subscription.cancelAtPeriodEnd && <button disabled={busy} className="mt-4 text-sm text-primary underline" onClick={() => { if (window.confirm('Cancel renewal at the end of the current billing period?')) run(async () => { await subscriptionRequest(`/api/subscriptions/${subscription.id}/cancel`, { owner }); setSummary(await subscriptionRequest(`/api/subscriptions/me?${query}`)); }); }}>Cancel renewal</button>}
        </article>)}</div>
        {!!summary.subscriptions.length && <button disabled={busy} className={`${buttonClass} mt-5`} onClick={() => run(async () => openBilling((await subscriptionRequest('/api/subscriptions/portal', { owner, feature })).url))}>Manage billing and invoices</button>}
      </section>}
      {(isArticle || summary.subscriptionsEnabled) && !existing && !returning && <section className="mt-8 rounded-2xl border border-border/70 p-5 sm:p-7" aria-labelledby="subscription-checkout-title">
        <ol className="mb-7 flex items-center gap-3 border-b border-border/70 pb-5" aria-label="Subscription checkout progress">{['Choose a plan', 'Billing details', 'Subscribe'].map((label, index) => <li key={label} aria-current={checkoutStep === index ? 'step' : undefined} className="flex flex-1 items-center gap-2 text-sm"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${checkoutStep >= index ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{checkoutStep > index ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}</span><span className={`${checkoutStep === index ? 'font-medium' : 'text-muted-foreground'} hidden sm:inline`}>{label}</span></li>)}</ol>
        <h2 ref={stepHeading} tabIndex={-1} id="subscription-checkout-title" className="text-2xl font-semibold tracking-tight outline-none">{['Choose your plan', 'Add your billing details', 'Review and subscribe'][checkoutStep]}</h2>
        {checkoutStep === 0 && <>
          <p className="mt-2 text-sm text-muted-foreground">Choose a plan, add billing details, then complete your subscription securely with Stripe.</p>
          {!options ? <p role="status" className="mt-5 text-sm">Loading plans…</p> : !options.plans.length ? <p className="mt-5 rounded-xl bg-secondary/40 p-4 text-sm text-muted-foreground">Subscription plans are being configured. You can continue working on drafts.</p> : <fieldset className="mt-5 grid gap-4 sm:grid-cols-2"><legend className="sr-only">Available subscription plans</legend>{options.plans.map(plan => <label key={plan.priceId} className={`cursor-pointer rounded-xl border p-5 transition-colors ${String(plan.priceId) === selectedPriceId ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}><div className="flex items-center justify-between gap-3"><span className="text-lg font-semibold">{plan.name}</span><input type="radio" name="subscription-plan" value={plan.priceId} checked={String(plan.priceId) === selectedPriceId} onChange={event => setSelectedPriceId(event.target.value)} className="h-4 w-4 accent-primary" /></div><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.description || (isArticle ? summary.monthlyLimit + ' new articles per calendar month.' : 'Publish events with this organizing account.')}</p><p className="mt-5 text-2xl font-semibold">{formatMoney(plan.amount, plan.currency)}<span className="text-sm font-normal text-muted-foreground"> / {plan.billingInterval}</span></p></label>)}</fieldset>}
          {options?.plans.length > 0 && <div className="mt-6"><button type="button" className={buttonClass + ' gap-2 rounded-xl'} disabled={!selectedPlan} onClick={() => { if (!profileId && matchingProfiles.length === 1) setProfileId(String(matchingProfiles[0].id)); setCheckoutStep(1); }}>Continue to billing details<ArrowRight className="h-4 w-4" aria-hidden="true" /></button>{!selectedPlan && <p className="mt-2 text-xs text-muted-foreground">Select a plan to continue.</p>}</div>}
        </>}
        {checkoutStep === 1 && <>
          <p className="mt-2 text-sm text-muted-foreground">Choose the details for your receipt, or add them here. No payment is taken at this step.</p>
          <div className="mt-5 max-w-xl"><BusinessIdentitySelector context="platform_buyer" profiles={matchingProfiles} value={profileId} onChange={setProfileId} onCreated={saved => setProfiles(current => [...current.filter(item => Number(item.id) !== Number(saved.id)), saved])} organizationId={owner.type === 'organization' ? owner.id : null} personalOnly={owner.type === 'user'} /></div>
          {!selectedProfile && <p className="mt-3 text-sm text-muted-foreground">{matchingProfiles.length ? 'Select billing details above to continue.' : 'Add your personal or organization details to unlock checkout.'}</p>}
          <div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => setCheckoutStep(0)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back</button><button type="button" disabled={!selectedProfile} onClick={() => setCheckoutStep(2)} className={buttonClass + ' gap-2 rounded-xl'}>Review subscription<ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div>
        </>}
        {checkoutStep === 2 && selectedPlan && selectedProfile && <>
          <div className="mt-5 rounded-xl bg-secondary/30 p-5"><p className="text-lg font-semibold">{selectedPlan.name}</p><p className="mt-2 text-2xl font-semibold">{formatMoney(selectedPlan.amount, selectedPlan.currency)}<span className="text-sm font-normal text-muted-foreground"> / {selectedPlan.billingInterval}</span></p><div className="mt-4 flex items-start gap-2 border-t border-border pt-4 text-sm"><CreditCard className="h-4 w-4 shrink-0" aria-hidden="true" /><span>Billing to <strong>{selectedProfile.legalName}</strong></span></div><p className="mt-4 text-sm leading-relaxed text-muted-foreground">Renews automatically. Cancel renewal at any time. Publishing access starts after your subscription is confirmed.</p></div>
          <div className="mt-6 flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={() => setCheckoutStep(1)} className="min-h-11 rounded-xl border border-border px-4 text-sm">Back to billing details</button><button type="button" className={buttonClass + ' gap-2 rounded-xl'} disabled={busy} onClick={() => run(async () => openBilling((await subscriptionRequest('/api/subscriptions/checkout', { owner, feature, priceId: Number(selectedPlan.priceId), billingProfileId: Number(selectedProfile.id), returnTo })).checkoutUrl))}>{busy ? 'Opening checkout…' : 'Subscribe with Stripe'}<LockKeyhole className="h-4 w-4" aria-hidden="true" /></button></div>
          <p className="mt-3 text-xs text-muted-foreground">You’ll enter payment details and confirm the subscription on Stripe.</p>{error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        </>}
      </section>}
      {!!summary.invoices.length && <section className="mt-8"><h2 className="text-xl font-semibold">Subscription invoices</h2><ul className="mt-4 space-y-3">{summary.invoices.map((invoice) => <li className="flex flex-wrap justify-between gap-2 border-b border-border py-3 text-sm" key={invoice.id}><span className="break-all">YKCircle · {invoice.status}</span>{invoice.hostedInvoiceUrl && <a className="text-primary underline" href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer">View invoice</a>}</li>)}</ul></section>}
    </>}
  </SubscriptionShell>;
}
