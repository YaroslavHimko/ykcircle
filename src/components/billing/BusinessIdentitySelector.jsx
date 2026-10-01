import React, { useState } from 'react';
import BillingProfileEditor from './BillingProfileEditor';
import { asList, billingRequest, ErrorNotice, inputClass } from './shared';
import { identityQuestions } from '@/lib/payments';

export default function BusinessIdentitySelector({ context, profiles, value, onChange, onCreated, organizationId, personalOnly = false, disabled = false }) {
  const [editor, setEditor] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [added, setAdded] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const choices = [...profiles, ...added.filter((entry) => !profiles.some((profile) => Number(profile.id) === Number(entry.id)))].filter((profile) => profile.isActive !== false && (!organizationId || Number(profile.ownerOrganizationId) === Number(organizationId)) && (!personalOnly || !profile.ownerOrganizationId));
  const add = async () => {
    setLoading(true); setError('');
    try {
      const rows = asList(await billingRequest('/api/my/organizations'), 'organizations');
      setOrganizations(rows);
      setEditor(organizationId ? { profileType: 'organization', ownerOrganizationId: organizationId, legalName: rows.find((entry) => Number(entry.id) === Number(organizationId))?.name || '' } : {});
    } catch (failure) { setError(failure.message); } finally { setLoading(false); }
  };
  return <div className="space-y-2"><label className="block text-sm font-medium">{identityQuestions[context]}<select disabled={disabled} value={value || ''} onChange={(event) => onChange(event.target.value)} className={inputClass}><option value="">Choose personal or business details</option>{choices.map((profile) => <option key={profile.id} value={profile.id}>{profile.legalName}{profile.profileType === 'individual' ? ' · Personal' : ''}</option>)}</select></label>
    <button type="button" disabled={disabled || loading} onClick={add} className="min-h-11 text-sm font-medium text-primary underline disabled:opacity-50">{loading ? 'Loading…' : personalOnly ? 'Add personal details' : 'Add business or personal details'}</button><ErrorNotice error={error} />
    {editor && <BillingProfileEditor profile={editor} organizations={organizations} personalOnly={personalOnly} fixedOrganizationId={organizationId} existingProfiles={choices} onOrganizationSaved={(saved) => setOrganizations((current) => [...current, saved])} onClose={() => setEditor(null)} onSaved={(saved) => { setAdded((current) => [...current.filter((entry) => entry.id !== saved.id), saved]); onCreated?.(saved); onChange(String(saved.id)); setEditor(null); }} />}
  </div>;
}
