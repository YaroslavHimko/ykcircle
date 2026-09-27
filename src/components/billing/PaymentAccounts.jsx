import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { asList, billingRequest, ErrorNotice, primaryButton, secondaryButton } from './shared';

function openStripe(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Stripe returned an invalid onboarding link. Please try again.'); }
  if (url.protocol !== 'https:' || !(url.hostname === 'stripe.com' || url.hostname.endsWith('.stripe.com'))) throw new Error('Stripe returned an invalid onboarding link. Please try again.');
  window.location.assign(url.toString());
}

export default function PaymentAccounts({ profile }) {
  const [accounts, setAccounts] = useState([]);
  const [state, setState] = useState({ loading: true, working: false, error: '' });
  const load = useCallback(async () => {
    setState({ loading: true, working: false, error: '' });
    try {
      const data = await billingRequest(`/api/me/billing-profiles/${profile.id}/payment-accounts`);
      setAccounts(asList(data, 'accounts'));
      setState({ loading: false, working: false, error: '' });
    } catch (error) { setState({ loading: false, working: false, error: error.message }); }
  }, [profile.id]);
  useEffect(() => { load(); }, [load]);
  const connect = async (account) => {
    setState((current) => ({ ...current, working: true, error: '' }));
    try {
      const data = await billingRequest(account ? `/api/payment-accounts/${account.id}/onboarding-link` : `/api/me/billing-profiles/${profile.id}/payment-accounts`, { method: 'POST' });
      openStripe(data.onboardingUrl);
    } catch (error) { setState((current) => ({ ...current, working: false, error: error.message })); }
  };
  return <div className="space-y-4"><div><h3 className="font-medium">Collect ticket payments</h3><p className="mt-1 text-sm text-muted-foreground">Connect Stripe when you sell paid event tickets. Venue rental payments go directly to your organization.</p></div>
    {state.loading ? <p role="status" className="text-sm text-muted-foreground">Checking payment accounts…</p> : <>
      {accounts.map((account) => <div key={account.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-secondary/40 p-4"><div><p className="flex items-center gap-2 text-sm font-medium">{account.chargesEnabled && <CheckCircle2 className="h-4 w-4 text-primary" />}Stripe {account.testMode ? '· test mode' : ''}</p><p className="mt-1 text-xs text-muted-foreground">{account.chargesEnabled ? 'Ready to collect payments' : (account.onboardingStatus || 'Setup required').replaceAll('_', ' ')}</p></div>{!account.chargesEnabled && <button type="button" disabled={state.working} onClick={() => connect(account)} className={secondaryButton}>{state.working ? 'Opening Stripe…' : 'Continue Stripe setup'}<ExternalLink className="h-4 w-4" /></button>}</div>)}
      {!accounts.length && !state.error && <button type="button" disabled={state.working} onClick={() => connect()} className={primaryButton}>{state.working ? 'Opening Stripe…' : 'Connect Stripe'}<ExternalLink className="h-4 w-4" /></button>}
    </>}<ErrorNotice error={state.error} />{state.error && <button type="button" onClick={load} disabled={state.working} className={secondaryButton}>Retry</button>}
  </div>;
}
