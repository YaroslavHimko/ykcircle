export const emptyBillingProfile = {
  profileType: 'individual', ownerOrganizationId: '', legalName: '', organizationNumber: '', vatNumber: '',
  addressLine1: '', addressLine2: '', postalCode: '', city: '', country: 'Sweden', billingEmail: '', phone: '',
  defaultCurrency: 'SEK', invoicePrefix: 'INV', invoiceDueDays: 30, paymentInstructions: '', isDefault: false,
};

export function safeBillingReturn(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\s]/.test(value)) return null;
  return value;
}

export function profileStepError(profile, step) {
  const required = step === 0 ? ['legalName', 'billingEmail'] : step === 1 ? ['addressLine1', 'postalCode', 'city', 'country'] : [];
  if (required.some((key) => !String(profile[key] ?? '').trim())) return 'Complete the required fields before continuing.';
  if (step === 0) {
    if (profile.profileType === 'organization' && !(Number(profile.ownerOrganizationId) > 0)) return 'Choose or add an organization first.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.billingEmail)) return 'Enter a valid billing email address.';
  }
  if (step === 2) {
    if (!/^[A-Z]{3}$/.test(profile.defaultCurrency)) return 'Enter a three-letter currency code, such as SEK.';
    if (!/^[A-Z0-9-]{1,20}$/.test(profile.invoicePrefix)) return 'Use 1–20 uppercase letters, numbers, or hyphens for the invoice prefix.';
    const days = Number(profile.invoiceDueDays);
    if (profile.invoiceDueDays === '' || !Number.isInteger(days) || days < 0 || days > 365) return 'Payment terms must be between 0 and 365 days.';
  }
  return '';
}
