import { useEffect, useState } from 'react';
import { apiFetch } from '@/shared/api/client.js';
import { auth, list, errorText } from '../model/platform-billing.js';
import { Shell, Notice } from '../components/FinancialShell.jsx';
export function PlatformAdminPage() {
  const [profiles, setProfiles] = useState([]);
  const [product, setProduct] = useState({
    productType: 'subscription',
    code: '',
    name: '',
    description: '',
    entitlementFeature: '',
  });
  const [price, setPrice] = useState({
    currency: 'SEK',
    amount: '',
    billingInterval: 'month',
    providerPriceId: '',
  });
  const [state, setState] = useState({
    error: '',
    notice: '',
    saving: false,
  });
  useEffect(() => {
    apiFetch('/api/me/billing-profiles', {
      headers: auth(),
    })
      .then(async (response) => (response.ok ? response.json() : []))
      .then((data) => setProfiles(list(data, 'profiles')))
      .catch(() => {});
  }, []);
  const saveProfile = async (billingProfileId) => {
    const response = await apiFetch('/api/admin/platform/billing-profile', {
      method: 'POST',
      headers: {
        ...auth(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billingProfileId: Number(billingProfileId),
      }),
    });
    if (!response.ok) {
      const data = await response.json();
      setState((current) => ({
        ...current,
        error: errorText(data, 'Unable to configure platform billing.'),
      }));
    } else
      setState((current) => ({
        ...current,
        notice: 'Platform seller billing profile saved.',
      }));
  };
  const saveProduct = async (event) => {
    event.preventDefault();
    setState({
      error: '',
      notice: '',
      saving: true,
    });
    try {
      const productResponse = await apiFetch('/api/admin/platform/products', {
        method: 'POST',
        headers: {
          ...auth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });
      const created = await productResponse.json();
      if (!productResponse.ok) throw new Error(errorText(created, 'Unable to create product.'));
      const priceResponse = await apiFetch(
        '/api/admin/platform/products/' + created.id + '/prices',
        {
          method: 'POST',
          headers: {
            ...auth(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...price,
            amount: Number(price.amount),
            billingInterval: product.productType === 'subscription' ? price.billingInterval : null,
          }),
        },
      );
      const priceData = await priceResponse.json();
      if (!priceResponse.ok)
        throw new Error(
          errorText(priceData, 'Product created, but its price could not be created.'),
        );
      setState({
        error: '',
        notice: 'Platform product and price created.',
        saving: false,
      });
      setProduct({
        productType: 'subscription',
        code: '',
        name: '',
        description: '',
        entitlementFeature: '',
      });
      setPrice({
        currency: 'SEK',
        amount: '',
        billingInterval: 'month',
        providerPriceId: '',
      });
    } catch (error) {
      setState({
        error: error.message,
        notice: '',
        saving: false,
      });
    }
  };
  return (
    <Shell
      title="Platform billing administration"
      eyebrow="Administration"
      description={
        <>
          Configure the legal seller used on platform invoices and create products with Stripe price
          IDs. Do not put secrets or account IDs in this page.
        </>
      }
    >
      <Notice error={state.error} />
      {state.notice && <p className="mt-5 text-sm text-primary">{state.notice}</p>}
      <label className="mt-7 block max-w-md text-sm font-medium">
        Platform seller billing profile
        <select
          onChange={(event) => event.target.value && saveProfile(event.target.value)}
          className="mt-2 min-h-11 w-full border border-border bg-background px-3"
        >
          <option value="">Choose profile</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.legalName}
            </option>
          ))}
        </select>
      </label>
      <form onSubmit={saveProduct} className="rounded-2xl mt-8 max-w-2xl border border-border p-5">
        <h2 className="font-display text-2xl font-semibold">New platform product</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select
            value={product.productType}
            onChange={(event) =>
              setProduct((current) => ({
                ...current,
                productType: event.target.value,
              }))
            }
            className="min-h-11 border border-border bg-background px-3"
          >
            <option value="subscription">Subscription</option>
            <option value="event_fee">Event fee</option>
            <option value="featured_listing">Featured listing</option>
            <option value="other">Other</option>
          </select>
          <input
            required
            value={product.code}
            onChange={(event) =>
              setProduct((current) => ({
                ...current,
                code: event.target.value,
              }))
            }
            placeholder="Code, e.g. pro-monthly"
            className="min-h-11 border border-border px-3"
          />
          <input
            required
            value={product.name}
            onChange={(event) =>
              setProduct((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Product name"
            className="min-h-11 border border-border px-3"
          />
          <input
            value={product.entitlementFeature}
            onChange={(event) =>
              setProduct((current) => ({
                ...current,
                entitlementFeature: event.target.value,
              }))
            }
            placeholder="Entitlement feature (optional)"
            className="min-h-11 border border-border px-3"
          />
          <textarea
            value={product.description}
            onChange={(event) =>
              setProduct((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Description"
            className="min-h-20 border border-border px-3 py-2 sm:col-span-2"
          />
          <input
            required
            min="0"
            step="0.01"
            type="number"
            value={price.amount}
            onChange={(event) =>
              setPrice((current) => ({
                ...current,
                amount: event.target.value,
              }))
            }
            placeholder="Amount"
            className="min-h-11 border border-border px-3"
          />
          <select
            value={price.currency}
            onChange={(event) =>
              setPrice((current) => ({
                ...current,
                currency: event.target.value,
              }))
            }
            className="min-h-11 border border-border bg-background px-3"
          >
            <option>SEK</option>
            <option>EUR</option>
            <option>USD</option>
          </select>
          <input
            value={price.providerPriceId}
            onChange={(event) =>
              setPrice((current) => ({
                ...current,
                providerPriceId: event.target.value,
              }))
            }
            placeholder="Stripe Price ID (optional)"
            className="min-h-11 border border-border px-3 sm:col-span-2"
          />
        </div>
        <button
          disabled={state.saving}
          className="ui-action mt-4 bg-primary px-4 py-3 text-sm text-primary-foreground disabled:opacity-60"
        >
          {state.saving ? 'Saving…' : 'Create product and price'}
        </button>
      </form>
    </Shell>
  );
}
