import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BusinessIdentitySelector from '../components/BusinessIdentitySelector.jsx';
import { apiFetch } from '@/shared/api/client.js';
import { auth, list, errorText, money, groupProducts } from '../model/platform-billing.js';
import { Shell, Notice } from '../components/FinancialShell.jsx';
export function PlatformBillingPage({ embedded = false }) {
  const [products, setProducts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState('');
  const [state, setState] = useState({
    loading: true,
    error: '',
    working: '',
  });
  const load = async () => {
    try {
      const [productResponse, profileResponse] = await Promise.all([
        apiFetch('/api/platform/products'),
        apiFetch('/api/me/billing-profiles', {
          headers: auth(),
        }),
      ]);
      const productData = await productResponse.json();
      const profileData = await profileResponse.json();
      if (!productResponse.ok)
        throw new Error(errorText(productData, 'Unable to load platform products.'));
      if (!profileResponse.ok)
        throw new Error(errorText(profileData, 'Unable to load business details.'));
      setProducts(groupProducts(list(productData, 'products')));
      const nextProfiles = list(profileData, 'profiles');
      setProfiles(nextProfiles);
      setProfileId(
        (current) => current || String(nextProfiles.find((profile) => profile.isDefault)?.id || ''),
      );
      setState({
        loading: false,
        error: '',
        working: '',
      });
    } catch (error) {
      setState({
        loading: false,
        error: error.message,
        working: '',
      });
    }
  };
  useEffect(() => {
    if (localStorage.getItem('authToken')) load();
    else
      setState({
        loading: false,
        error: 'Sign in to purchase platform services.',
        working: '',
      });
  }, []);
  const checkout = async (product, price) => {
    if (!profileId)
      return setState((current) => ({
        ...current,
        error: 'Choose who should be billed first.',
      }));
    if (product.productType === 'event_fee')
      return setState((current) => ({
        ...current,
        error: 'Event-specific fees are purchased from the event management flow.',
      }));
    setState((current) => ({
      ...current,
      error: '',
      working: product.id + '-' + price.id,
    }));
    try {
      const orderResponse = await apiFetch('/api/platform/orders', {
        method: 'POST',
        headers: {
          ...auth(),
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          productId: product.id,
          priceId: price.id,
          buyerBillingProfileId: Number(profileId),
          buyerCapacity: 'consumer',
        }),
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(errorText(order, 'Unable to create order.'));
      const checkoutResponse = await apiFetch('/api/platform/orders/' + order.id + '/checkout', {
        method: 'POST',
        headers: {
          ...auth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          successUrl: window.location.href,
          cancelUrl: window.location.href,
        }),
      });
      const data = await checkoutResponse.json();
      if (!checkoutResponse.ok) throw new Error(errorText(data, 'Unable to start checkout.'));
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.message,
        working: '',
      }));
    }
  };
  return (
    <Shell
      title="Your plan"
      embedded={embedded}
      description={
        <>
          YKCircle is the seller for these purchases. Choose the personal or business details to use
          on your invoice.
        </>
      }
    >
      <Link to="/profile/subscriptions" className="mt-5 inline-block text-primary underline">
        Manage your YKCircle plan
      </Link>
      <Notice error={state.error} />
      {state.loading ? (
        <p className="mt-8 text-muted-foreground">Loading products…</p>
      ) : (
        <>
          <div className="mt-7 max-w-md">
            <BusinessIdentitySelector
              context="platform_buyer"
              profiles={profiles}
              value={profileId}
              onChange={setProfileId}
              onCreated={(saved) =>
                setProfiles((current) => [...current.filter((item) => item.id !== saved.id), saved])
              }
            />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {!products.length && (
              <p className="text-sm text-muted-foreground">
                No platform services are available right now.
              </p>
            )}
            {products.map((product) => (
              <article key={product.id} className="rounded-2xl border border-border p-5">
                <h2 className="font-display text-2xl font-semibold">{product.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
                {product.prices.map((price) => (
                  <div key={price.id} className="mt-5 flex items-center justify-between gap-3">
                    <span>
                      {money(price.amount, price.currency)}
                      {price.billingInterval ? ' / ' + price.billingInterval : ''}
                    </span>
                    <button
                      type="button"
                      disabled={Boolean(state.working)}
                      onClick={() => checkout(product, price)}
                      className="ui-action bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
                    >
                      {state.working === product.id + '-' + price.id ? 'Opening…' : 'Purchase'}
                    </button>
                  </div>
                ))}
              </article>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
