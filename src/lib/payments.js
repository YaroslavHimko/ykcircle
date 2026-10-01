import { safeBillingReturn } from './billing.js';

export const paymentTitles = { plan: 'Your plan', tickets: 'Ticket payments', venues: 'Venue payments', business: 'Business details', documents: 'Invoices & receipts' };
export const identityQuestions = { platform_buyer: 'Who should be billed?', ticket_seller: 'Who is selling these tickets?', venue_seller: 'Who operates this Venue?', venue_buyer: 'Who is paying for this Venue?' };
export const ticketStatus = { business_required: 'Business details required', not_set_up: 'Not set up', incomplete: 'Setup incomplete', action_required: 'Action required', ready: 'Ready to sell tickets' };
export const missingLabels = { pricing: 'Pricing required', sellerBillingProfile: 'Seller business details', invoiceSeries: 'Invoice numbering', paymentInstructions: 'Payment method required', taxConfiguration: 'Tax settings', invoiceAuthorization: 'Invoice authorization' };
export const methodLabels = { bank_transfer: 'Bank transfer', bankgiro: 'Bankgiro', plusgiro: 'Plusgiro', swish: 'Swish', cash: 'Cash', other: 'Other' };
export const formatMoney = (amount, currency = 'SEK') => amount == null ? 'Pricing required' : new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount));
export const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '';

export function subscriptionStatus(subscription) {
  if (['past_due', 'unpaid'].includes(subscription.status)) return 'Payment issue';
  if (subscription.cancelAtPeriodEnd && ['active', 'trialing'].includes(subscription.status)) return `Active until ${formatDate(subscription.currentPeriodEnd)}`;
  return { active: 'Active', trialing: 'Trial', paused: 'Paused', incomplete: 'Setup incomplete', pending: 'Setup incomplete', canceled: 'Ended', cancelled: 'Ended', expired: 'Ended', incomplete_expired: 'Ended' }[subscription.status] || 'No active plan';
}

export function usageLabel(usage) {
  return { platform_subscription: 'YKCircle plan', platform_purchase: 'YKCircle purchases', ticket_seller: 'Selling Event tickets', venue_buyer: 'Booking Venues',
    venue_seller: `Operating ${usage.name} · Venue invoicing and booking payments`, event_organizer: `Organizer of ${usage.count} ${usage.count === 1 ? 'Event' : 'Events'}` }[usage.purpose] || 'Payments and invoices';
}

export function legacyPaymentsPath(search, section = 'overview') {
  const params = new URLSearchParams(search);
  const target = params.get('section') || section;
  params.delete('section');
  const route = target === 'organizations' ? '/account/organizations' : `/account/payments${({ profiles: '/business', platform: '/plan', invoices: '/documents', venues: '/venues', tickets: '/tickets' })[target] || ''}`;
  return route + (params.size ? `?${params}` : '');
}

export function setupPath(area, returnTo, extra = {}) {
  const query = new URLSearchParams(extra);
  const safe = safeBillingReturn(returnTo);
  if (safe) query.set('returnTo', safe);
  return `/account/payments/${area}${query.size ? `?${query}` : ''}`;
}
