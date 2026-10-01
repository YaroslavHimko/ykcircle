import React, { useEffect, useRef, useState } from 'react';
import { Check, ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { emptyBillingProfile, profileStepError } from '@/lib/billing';
import OrganizationEditor from './OrganizationEditor';
import { billingRequest, Field, ErrorNotice, inputClass, primaryButton, secondaryButton } from './shared';

const steps = ['Your identity', 'Billing address', 'Invoice preferences', 'Review & save'];

export default function BillingProfileEditor({ profile, organizations, onOrganizationSaved, onSaved, onClose, existingProfiles = [], personalOnly = false, fixedOrganizationId = null }) {
  const [form, setForm] = useState({ ...emptyBillingProfile, ...profile });
  const [step, setStep] = useState(0);
  const [addingOrganization, setAddingOrganization] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, [step]);
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault(); setError('');
    const invalid = profileStepError(form, step);
    if (invalid) return setError(invalid);
    if (step < 3) return setStep(step + 1);
    for (let index = 0; index < 3; index++) {
      const issue = profileStepError(form, index);
      if (issue) { setStep(index); setError(issue); return; }
    }
    if (!form.id) {
      const existing = existingProfiles.find((item) => (form.ownerOrganizationId && Number(item.ownerOrganizationId) === Number(form.ownerOrganizationId)) || (!form.ownerOrganizationId && !item.ownerOrganizationId && item.legalName.trim().toLowerCase() === form.legalName.trim().toLowerCase()));
      if (existing) { setStep(0); setError('These details already exist. Choose Use existing details below.'); return; }
    }
    setSaving(true);
    try {
      const saved = await billingRequest(form.id ? `/api/me/billing-profiles/${form.id}` : '/api/me/billing-profiles', {
        method: form.id ? 'PUT' : 'POST', body: JSON.stringify({ ...form, ownerOrganizationId: form.profileType === 'organization' ? Number(form.ownerOrganizationId) : null, invoiceDueDays: Number(form.invoiceDueDays) }),
      });
      onSaved(saved);
    } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };
  const existingIdentity = !form.id && existingProfiles.find((item) => (form.ownerOrganizationId && Number(item.ownerOrganizationId) === Number(form.ownerOrganizationId)) || (!form.ownerOrganizationId && !item.ownerOrganizationId && item.legalName.trim().toLowerCase() === form.legalName.trim().toLowerCase()));
  const owner = organizations.find((item) => Number(item.id) === Number(form.ownerOrganizationId));
  return <><Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}><DialogContent className="max-h-[92dvh] max-w-3xl overflow-y-auto p-0">
    <div className="border-b border-border px-6 pb-5 pt-7"><p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">Business details</p><DialogTitle className="font-display text-3xl">{form.id ? 'Edit business details' : 'Add business or personal details'}</DialogTitle><DialogDescription className="mt-2">Legal and contact information used for payments and invoices.</DialogDescription></div>
    <div className="grid sm:grid-cols-[180px_1fr]">
      <ol aria-label="Business details progress" className="flex gap-2 border-b border-border bg-secondary/25 p-4 sm:flex-col sm:gap-5 sm:border-b-0 sm:border-r sm:p-6">{steps.map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined} className="flex-1 sm:flex-none"><button type="button" disabled={index > step || saving} onClick={() => { setStep(index); setError(''); }} className={`flex items-center gap-3 text-left text-sm ${step === index ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${index <= step ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{index < step ? <Check className="h-4 w-4" /> : index + 1}</span><span className="hidden sm:inline">{label}</span></button></li>)}</ol>
      <form onSubmit={submit} className="min-w-0 space-y-6 p-6"><div><p className="text-xs text-muted-foreground">Step {step + 1} of {steps.length}</p><h2 ref={heading} tabIndex={-1} className="mt-1 font-display text-2xl font-semibold outline-none">{steps[step]}</h2></div>
        <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
          {step === 0 && <>{existingIdentity && <div className="rounded-md bg-secondary/40 p-4 sm:col-span-2"><p className="text-sm">{existingIdentity.legalName} is already saved.</p><button type="button" className="mt-2 min-h-11 text-sm text-primary underline" onClick={() => onSaved(existingIdentity)}>Use existing details</button></div>}<label className="text-sm font-medium sm:col-span-2">Who are these details for?<select value={form.profileType} disabled={Boolean(form.id) || personalOnly || Boolean(fixedOrganizationId)} onChange={(event) => set('profileType')(event.target.value)} className={inputClass}><option value="individual">Me, as an individual</option><option value="organization">An organization</option></select></label>
            {form.profileType === 'organization' && <div className="sm:col-span-2"><label className="text-sm font-medium">Organization *<select required disabled={Boolean(form.id) || Boolean(fixedOrganizationId)} value={form.ownerOrganizationId || ''} onChange={(event) => set('ownerOrganizationId')(event.target.value)} className={inputClass}><option value="">Choose organization</option>{organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{!form.id && !fixedOrganizationId && <button type="button" onClick={() => setAddingOrganization(true)} className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary"><Plus className="h-4 w-4" />Add organization</button>}</div>}
            <Field label="Legal name" required maxLength={255} value={form.legalName} onChange={set('legalName')} /><Field label="Billing email" required type="email" maxLength={255} value={form.billingEmail} onChange={set('billingEmail')} />
            {form.profileType === 'organization' && <><Field label="Organization number" maxLength={255} value={form.organizationNumber} onChange={set('organizationNumber')} /><Field label="VAT number" maxLength={255} value={form.vatNumber} onChange={set('vatNumber')} /></>}
            <p className="text-xs text-muted-foreground sm:col-span-2">Use the legal name that should appear on invoices. Choose the person or company responsible for these transactions.</p></>}
          {step === 1 && <><Field label="Address line 1" required maxLength={255} autoComplete="address-line1" value={form.addressLine1} onChange={set('addressLine1')} /><Field label="Address line 2" maxLength={255} autoComplete="address-line2" value={form.addressLine2} onChange={set('addressLine2')} /><Field label="Postal code" required maxLength={255} autoComplete="postal-code" value={form.postalCode} onChange={set('postalCode')} /><Field label="City" required maxLength={255} autoComplete="address-level2" value={form.city} onChange={set('city')} /><Field label="Country" required maxLength={255} autoComplete="country-name" value={form.country} onChange={set('country')} /><Field label="Phone" type="tel" maxLength={255} autoComplete="tel" value={form.phone} onChange={set('phone')} /></>}
          {step === 2 && <><Field label="Currency" required maxLength={3} pattern="[A-Z]{3}" value={form.defaultCurrency} onChange={(value) => set('defaultCurrency')(value.toUpperCase())} /><details className="sm:col-span-2"><summary className="min-h-11 cursor-pointer text-sm font-medium">Advanced invoice settings</summary><div className="grid gap-4 sm:grid-cols-2"><Field label="Invoice prefix" required maxLength={20} pattern="[A-Z0-9-]{1,20}" value={form.invoicePrefix} onChange={(value) => set('invoicePrefix')(value.toUpperCase())} /><Field label="Payment due (days)" required type="number" min={0} max={365} step={1} value={form.invoiceDueDays} onChange={set('invoiceDueDays')} /><label className="text-sm font-medium sm:col-span-2">Payment instructions<textarea maxLength={5000} value={form.paymentInstructions || ''} onChange={(event) => set('paymentInstructions')(event.target.value)} className={`${inputClass} min-h-24 py-3`} /></label></div></details><label className="flex items-start gap-3 text-sm sm:col-span-2"><input type="checkbox" checked={Boolean(form.isDefault)} onChange={(event) => set('isDefault')(event.target.checked)} className="mt-1" />Use these details by default when I make a purchase</label><p className="text-xs text-muted-foreground sm:col-span-2">Venue payment instructions and tax settings can be configured in Venue payments after saving.</p></>}
          {step === 3 && <div className="space-y-5 sm:col-span-2"><p className="text-sm text-muted-foreground">Check your details before saving. You can edit them later.</p>{[[0, 'Identity', [form.legalName, owner?.name, form.billingEmail, form.organizationNumber, form.vatNumber]], [1, 'Address', [form.addressLine1, form.addressLine2, `${form.postalCode} ${form.city}`, form.country, form.phone]], [2, 'Invoice preferences', [form.defaultCurrency, `${form.invoicePrefix} · due in ${form.invoiceDueDays} days`, form.paymentInstructions, form.isDefault ? 'Default for purchases' : '']]].map(([index, title, values]) => <div key={title} className="flex justify-between gap-4 border-b border-border pb-4"><div className="min-w-0"><h3 className="text-sm font-semibold">{title}</h3>{values.filter(Boolean).map((value, row) => <p key={row} className="mt-1 break-words text-sm text-muted-foreground">{value}</p>)}</div><button type="button" onClick={() => setStep(index)} className="h-fit text-sm text-primary underline">Edit<span className="sr-only"> {title}</span></button></div>)}</div>}
        </fieldset><ErrorNotice error={error} /><div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><button type="button" disabled={saving} onClick={() => { if (step === 0) onClose(); else { setStep(step - 1); setError(''); } }} className={secondaryButton}><ArrowLeft className="h-4 w-4" />{step === 0 ? 'Cancel' : 'Back'}</button><button disabled={saving} className={primaryButton}>{saving ? 'Saving…' : step === 3 ? 'Save details' : 'Continue'}{step < 3 && <ArrowRight className="h-4 w-4" />}</button></div>
      </form>
    </div>
  </DialogContent></Dialog>{addingOrganization && <OrganizationEditor onClose={() => setAddingOrganization(false)} onSaved={(saved) => { onOrganizationSaved(saved); setForm((current) => ({ ...current, ownerOrganizationId: saved.id, legalName: current.legalName || saved.name, billingEmail: current.billingEmail || saved.contactEmail || '', phone: current.phone || saved.phone || '' })); setAddingOrganization(false); }} />}</>;
}
