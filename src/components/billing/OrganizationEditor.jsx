import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { billingRequest, Field, ErrorNotice, primaryButton, secondaryButton, inputClass } from './shared';

export default function OrganizationEditor({ organization, onSaved, onClose }) {
  const [form, setForm] = useState({ name: '', slug: '', websiteUrl: '', contactEmail: '', phone: '', description: '', ...organization });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const saved = await billingRequest(form.id ? `/api/organizations/${form.id}` : '/api/organizations', {
        method: form.id ? 'PUT' : 'POST', body: JSON.stringify({ name: form.name, slug: form.slug || form.name, websiteUrl: form.websiteUrl, contactEmail: form.contactEmail, phone: form.phone, description: form.description }),
      });
      onSaved(saved);
    } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}><DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
    <DialogTitle>{form.id ? 'Edit organization' : 'Add organization'}</DialogTitle>
    <DialogDescription>Your organization brings together your team, Events and Venues. Manage legal and payment information under Business details.</DialogDescription>
    <form onSubmit={save} className="space-y-5"><fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
      <Field label="Organization name" required minLength={2} maxLength={160} value={form.name} onChange={set('name')} />
      <Field label="Organization URL name" maxLength={180} value={form.slug} placeholder="Generated from your name" onChange={set('slug')} />
      <Field label="Contact email" type="email" maxLength={255} value={form.contactEmail} onChange={set('contactEmail')} />
      <Field label="Website" type="url" pattern="https://.*" placeholder="https://example.com" maxLength={1024} value={form.websiteUrl} onChange={set('websiteUrl')} />
      <Field label="Phone" type="tel" maxLength={50} value={form.phone} onChange={set('phone')} />
      <label className="text-sm font-medium sm:col-span-2">About the organization<textarea maxLength={5000} value={form.description || ''} onChange={(event) => set('description')(event.target.value)} className={`${inputClass} min-h-24 py-3`} /></label>
    </fieldset><ErrorNotice error={error} /><div className="flex flex-wrap justify-end gap-3"><button type="button" disabled={saving} onClick={onClose} className={secondaryButton}>Cancel</button><button disabled={saving} className={primaryButton}>{saving ? 'Saving…' : 'Save organization'}</button></div></form>
  </DialogContent></Dialog>;
}
