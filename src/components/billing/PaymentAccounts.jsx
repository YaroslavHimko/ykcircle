import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { safeBillingReturn } from '@/lib/billing';
import { PaymentStatus } from './PaymentCards';
import { asList, billingRequest, ErrorNotice, primaryButton, secondaryButton } from './shared';

function openStripe(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Stripe returned an invalid setup link. Please try again.'); }
  if (url.protocol !== 'https:' || !(url.hostname === 'stripe.com' || url.hostname.endsWith('.stripe.com'))) throw new Error('Stripe returned an invalid setup link. Please try again.');
  window.location.assign(url.toString());
}
export default function PaymentAccounts({ profile, returnTo, onUpdated, beforeConnect }) {
  const [accounts, setAccounts] = useState([]);
  const [state, setState] = useState({ loading: true, working: false, error: '' });
  const load = useCallback(async () => {
    setState({ loading: true, working: false, error: '' });
    try { setAccounts(asList(await billingRequest(`/api/me/billing-profiles/${profile.id}/payment-accounts`), 'accounts')); setState({ loading: false, working: false, error: '' }); }
    catch (error) { setState({ loading: false, working: false, error: error.message }); }
  }, [profile.id]);
  useEffect(() => { load(); }, [load]);
  const connect = async (account) => {
    setState((current) => ({ ...current, working: true, error: '' }));
    try {
      beforeConnect?.();
      const data = await billingRequest(account ? `/api/payment-accounts/${account.id}/onboarding-link` : `/api/me/billing-profiles/${profile.id}/payment-accounts`, { method: 'POST' });
      const accountId = account?.id || data.account?.id;
      if (accountId) sessionStorage.setItem(`ticket-setup-return:${accountId}`, safeBillingReturn(returnTo) || '/account/payments/tickets');
      if (data.onboardingUrl) openStripe(data.onboardingUrl); else { await load(); onUpdated?.(); }
    } catch (error) { setState((current) => ({ ...current, working: false, error: error.message })); }
  };
  return <div className="mt-5 space-y-4"><p className="text-sm text-muted-foreground">Payment provider: Stripe</p>
    {state.loading ? <p role="status" className="text-sm text-muted-foreground">Checking ticket payments…</p> : <>
      {accounts.map((account) => {
        const ready = account.chargesEnabled && account.onboardingStatus === 'ready';
        const attention = account.onboardingStatus === 'restricted' || account.onboardingStatus === 'ready' || account.detailsSubmitted;
        return <div key={account.id} className="rounded-lg bg-secondary/30 p-4"><PaymentStatus state={ready ? 'ready' : attention ? 'action_required' : 'incomplete'}>{ready ? 'Ready to sell tickets' : attention ? 'Action required' : 'Setup incomplete'}</PaymentStatus>{account.testMode && <p className="mt-3 text-sm">Stripe test mode</p>}<dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Payments enabled</dt><dd>{account.chargesEnabled ? 'Yes' : 'No'}</dd></div><div><dt className="text-muted-foreground">Payouts enabled</dt><dd>{account.payoutsEnabled ? 'Yes' : 'No'}</dd></div></dl>{!account.payoutsEnabled && ready && <p className="mt-3 text-sm">Complete any remaining Stripe requirements to receive payouts.</p>}<div className="mt-4 flex flex-wrap gap-3">{!ready ? <button type="button" disabled={state.working} onClick={() => connect(account)} className={secondaryButton}>{state.working ? 'Opening Stripe…' : 'Continue Stripe setup'}<ExternalLink aria-hidden="true" className="h-4 w-4" /></button> : <a className={secondaryButton} href="https://dashboard.stripe.com" target="_blank" rel="noreferrer">Manage Stripe connection<ExternalLink aria-hidden="true" className="h-4 w-4" /></a>}<button type="button" className={secondaryButton} onClick={async () => { await load(); onUpdated?.(); }}>Refresh status</button></div></div>;
      })}
      {!accounts.length && !state.error && <><p className="text-sm text-muted-foreground">Complete Stripe setup to start selling tickets.</p><button type="button" disabled={state.working} onClick={() => connect()} className={primaryButton}>{state.working ? 'Opening Stripe…' : 'Set up ticket payments'}<ExternalLink aria-hidden="true" className="h-4 w-4" /></button></>}
    </>}<ErrorNotice error={state.error} />{state.error && <button type="button" onClick={load} disabled={state.working} className={secondaryButton}>Retry</button>}
  </div>;
}
