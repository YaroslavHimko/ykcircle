export const auth = () => ({
  Authorization: 'Bearer ' + localStorage.getItem('authToken'),
});
export const list = (data, key) => (Array.isArray(data) ? data : data?.[key] || []);
export const errorText = (data, fallback) => data?.error || data?.message || fallback;
export const money = (value, currency = 'SEK') =>
  new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency,
  }).format(Number(value || 0));
export const date = (value) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
      }).format(new Date(value))
    : '—';
export const openStripeOnboarding = (value) => {
  try {
    const url = new URL(value);
    const stripeHost = url.hostname === 'stripe.com' || url.hostname.endsWith('.stripe.com');
    if (url.protocol !== 'https:' || !stripeHost) throw new Error('invalid Stripe URL');
    window.location.assign(url.toString());
  } catch {
    throw new Error('Stripe returned an invalid onboarding link. Please try again.');
  }
};
export const groupProducts = (rows) =>
  Object.values(
    rows
      .filter((row) => row.productType !== 'subscription')
      .reduce((all, row) => {
        const product = all[row.id] || {
          ...row,
          prices: [],
        };
        if (row.priceId)
          product.prices.push({
            id: row.priceId,
            amount: row.amount,
            currency: row.currency,
            billingInterval: row.billingInterval,
          });
        all[row.id] = product;
        return all;
      }, {}),
  );
