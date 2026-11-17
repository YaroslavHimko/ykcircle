export const fieldClass = 'mt-2 min-h-11 w-full min-w-0 border border-border bg-background px-3';

export const buttonClass =
  'inline-flex min-h-11 items-center justify-center bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50';

export const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        dateStyle: 'medium',
      })
    : '—';

export function openBilling(url) {
  const target = new URL(url);
  if (
    target.protocol !== 'https:' ||
    !(target.hostname === 'stripe.com' || target.hostname.endsWith('.stripe.com'))
  )
    throw new Error('The billing link is invalid. Please retry.');
  window.location.assign(target.href);
}
