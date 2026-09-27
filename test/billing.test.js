import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyBillingProfile, profileStepError, safeBillingReturn } from '../src/lib/billing.js';

test('billing return paths keep local flows and reject external redirects', () => {
  assert.equal(safeBillingReturn('/profile/venues/12/billing?from=setup'), '/profile/venues/12/billing?from=setup');
  for (const value of [null, '', 'https://other.test', '//other.test', '/\\other.test', '/\n/other.test']) assert.equal(safeBillingReturn(value), null);
});

test('organization setup requires an owner and a valid legal identity', () => {
  const profile = { ...emptyBillingProfile, profileType: 'organization', legalName: 'Harbor Hall', billingEmail: 'billing@harbor.test' };
  assert.match(profileStepError(profile, 0), /organization/);
  assert.equal(profileStepError({ ...profile, ownerOrganizationId: 2 }, 0), '');
  assert.match(profileStepError({ ...profile, ownerOrganizationId: 2, billingEmail: 'invalid' }, 0), /email/);
  assert.notEqual(profileStepError({ ...profile, ownerOrganizationId: 2, legalName: '  ' }, 0), '');
});

test('billing address is required before review', () => {
  assert.notEqual(profileStepError(emptyBillingProfile, 1), '');
  assert.equal(profileStepError({ addressLine1: 'Harbor 1', postalCode: '11122', city: 'Stockholm', country: 'Sweden' }, 1), '');
});

test('invoice preferences preserve zero-day terms and reject invalid values', () => {
  assert.equal(profileStepError({ ...emptyBillingProfile, invoiceDueDays: 0 }, 2), '');
  for (const invoiceDueDays of ['', -1, 366, 1.5, 'bad']) assert.notEqual(profileStepError({ ...emptyBillingProfile, invoiceDueDays }, 2), '');
  assert.notEqual(profileStepError({ ...emptyBillingProfile, defaultCurrency: 'EURO' }, 2), '');
  assert.notEqual(profileStepError({ ...emptyBillingProfile, invoicePrefix: 'INVALID PREFIX' }, 2), '');
});
