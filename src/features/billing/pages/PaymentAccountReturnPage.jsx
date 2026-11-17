import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { billingRequest as request } from '../api/billing.js';
import { safeBillingReturn } from '../model/billing.js';
import { openStripeOnboarding } from '../model/platform-billing.js';
import { Shell, Notice } from '../components/FinancialShell.jsx';
export function PaymentAccountReturnPage({ refresh = false }) {
  const [params] = useSearchParams();
  const accountId = Number(params.get('accountId'));
  const [state, setState] = useState({
    loading: Boolean(accountId),
    error: '',
    account: null,
    working: false,
  });
  const load = async () => {
    if (!Number.isInteger(accountId) || accountId < 1 || !localStorage.getItem('authToken')) return;
    setState((current) => ({
      ...current,
      loading: true,
      error: '',
    }));
    try {
      const data = await request(`/api/payment-accounts/${accountId}/status`);
      setState({
        loading: false,
        error: '',
        account: data,
        working: false,
      });
    } catch (error) {
      setState({
        loading: false,
        error: error.message,
        account: null,
        working: false,
      });
    }
  };
  useEffect(() => {
    load();
  }, [accountId]);
  const continueOnboarding = async () => {
    setState((current) => ({
      ...current,
      working: true,
      error: '',
    }));
    try {
      const data = await request(`/api/payment-accounts/${accountId}/onboarding-link`, {
        method: 'POST',
      });
      if (data.onboardingUrl) openStripeOnboarding(data.onboardingUrl);
      else await load();
    } catch (error) {
      setState((current) => ({
        ...current,
        working: false,
        error: error.message,
      }));
    }
  };
  const account = state.account;
  return (
    <Shell
      title={
        account?.chargesEnabled
          ? 'Ticket payments ready'
          : refresh
            ? 'Continue payment setup'
            : 'Check payment setup'
      }
      eyebrow="Ticket payments"
      description={<>Your ticket payment setup has been checked with Stripe.</>}
    >
      {account?.testMode && (
        <p className="rounded-2xl mt-4 border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <strong>Test mode</strong> — onboarding and ticket purchases use Stripe sandbox data only.
        </p>
      )}
      {state.loading && (
        <p className="mt-5 text-muted-foreground">Checking Stripe account status…</p>
      )}
      {state.error && <Notice error={state.error} />}
      {account && (
        <section className="rounded-2xl mt-6 max-w-xl border border-border p-5">
          <p className="font-medium">
            {account.chargesEnabled
              ? 'Ready to collect payments'
              : account.onboardingStatus === 'restricted'
                ? 'More Stripe details are required'
                : 'Onboarding is not complete'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Card payments: {account.chargesEnabled ? 'enabled' : 'not enabled'}
            {account.requirementsStatus
              ? ` · requirements: ${account.requirementsStatus.replaceAll('_', ' ')}`
              : ''}
          </p>
          {!account.chargesEnabled && (
            <button
              type="button"
              disabled={state.working}
              onClick={continueOnboarding}
              className="ui-action mt-5 bg-primary px-5 py-3 text-sm text-primary-foreground disabled:opacity-60"
            >
              {state.working ? 'Opening Stripe…' : 'Continue Stripe setup'}
            </button>
          )}
        </section>
      )}
      <Link
        to={
          safeBillingReturn(sessionStorage.getItem(`ticket-setup-return:${accountId}`)) ||
          '/account/payments/tickets'
        }
        className="ui-action mt-6 inline-block border border-border px-5 py-3 text-sm"
      >
        Return to your setup
      </Link>
    </Shell>
  );
}
