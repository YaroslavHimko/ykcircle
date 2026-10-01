import assert from 'node:assert/strict';
import test from 'node:test';
import { identityQuestions, legacyPaymentsPath, setupPath, subscriptionStatus, ticketStatus, usageLabel } from '../src/lib/payments.js';

test('old financial bookmarks preserve filters and setup context', () => {
  assert.equal(legacyPaymentsPath(''), '/account/payments');
  assert.equal(legacyPaymentsPath('?section=organizations&organizationId=9'), '/account/organizations?organizationId=9');
  assert.equal(legacyPaymentsPath('?section=venues&venueId=3&returnTo=%2Fevents%2F4'), '/account/payments/venues?venueId=3&returnTo=%2Fevents%2F4');
  assert.equal(legacyPaymentsPath('', 'profiles'), '/account/payments/business');
  assert.equal(legacyPaymentsPath('', 'platform'), '/account/payments/plan');
  assert.equal(legacyPaymentsPath('', 'invoices'), '/account/payments/documents');
});
test('contextual setup preserves local destinations and rejects external returns', () => {
  assert.equal(setupPath('tickets', '/events/12', { sellerId: '3' }), '/account/payments/tickets?sellerId=3&returnTo=%2Fevents%2F12');
  for (const invalid of ['https://other.test', '//other.test', '/\\other.test']) assert.equal(setupPath('tickets', invalid), '/account/payments/tickets');
  assert.equal(identityQuestions.platform_buyer, 'Who should be billed?');
  assert.equal(identityQuestions.venue_buyer, 'Who is paying for this Venue?');
});
test('plan and seller states use actionable language without provider identifiers', () => {
  assert.equal(subscriptionStatus({ status: 'past_due' }), 'Payment issue');
  assert.equal(subscriptionStatus({ status: 'active' }), 'Active');
  assert.match(subscriptionStatus({ status: 'active', cancelAtPeriodEnd: true, currentPeriodEnd: '2026-11-01' }), /^Active until /);
  assert.equal(subscriptionStatus({ status: 'canceled' }), 'Ended');
  assert.equal(ticketStatus.action_required, 'Action required');
  assert.equal(ticketStatus.incomplete, 'Setup incomplete');
  assert.equal(usageLabel({ purpose: 'event_organizer', count: 4 }), 'Organizer of 4 Events');
  assert.match(usageLabel({ purpose: 'venue_seller', name: 'Studio' }), /Studio/);
});
