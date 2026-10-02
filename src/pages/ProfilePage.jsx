import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import SiteChrome from '@/components/SiteChrome';
import { useProductConfiguration } from '@/lib/product-configuration';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { apiAssetUrl, apiFetch } from '@/lib/api';
import { ArrowUpRight, Building2, Camera, ChevronDown, CreditCard, Mail, ShieldCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const profilePictureUrl = (value) => {
  if (!value) return '';
  if (!/^https?:\/\//i.test(value) && !value.startsWith('/')) return apiAssetUrl(`/uploads/profile-pictures/${value}`);
  try { const parsed = new URL(value, window.location.origin); return parsed.pathname.startsWith('/uploads/profile-pictures/') ? apiAssetUrl(parsed.pathname) : parsed.toString(); }
  catch { return value; }
};

export default function ProfilePage() {
  const product = useProductConfiguration();
  const paidFeatures = product.subscriptionsEnabled || product.paidEventsEnabled || product.paidVenuesEnabled || product.paidServicesEnabled;
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const storedUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  const [user, setUser] = useState(storedUser);
  const [error, setError] = useState('');
  const [savingPreference, setSavingPreference] = useState(false);
  const [emailPreferences, setEmailPreferences] = useState(null);
  const [emailError, setEmailError] = useState('');
  const [emailNotice, setEmailNotice] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  useEffect(() => {
    if (!token) return;
    let active = true;
    apiFetch('/api/auth/profile/email-preferences', { headers: { Authorization: 'Bearer ' + token } }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load email preferences.');
      if (active) setEmailPreferences(data);
    }).catch(failure => { if (active) setEmailError(failure.message); });
    return () => { active = false; };
  }, [token]);
  const updateEmailPreference = async (key, value) => {
    setSavingEmail(true); setEmailError(''); setEmailNotice('');
    try {
      const response = await apiFetch('/api/auth/profile/email-preferences', { method: 'PATCH', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: value }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update email preferences.');
      setEmailPreferences(data); setEmailNotice('Email preferences saved.');
    } catch (failure) { setEmailError(failure.message); } finally { setSavingEmail(false); }
  };
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  useEffect(() => {
    if (!token || !storedUser) { navigate('/login', { replace: true, state: { from: '/profile' } }); return; }
    const headers = { Authorization: `Bearer ${token}` };
    apiFetch('/api/auth/profile', { headers }).then(async (profileResponse) => {
      const profileData = await profileResponse.json();
      if (!profileResponse.ok) throw new Error(profileData.error || 'Unable to load profile data.');
      const profile = { ...(profileData.user || profileData), profilePicture: profilePictureUrl((profileData.user || profileData).profilePicture) };
      setUser(profile); localStorage.setItem('authUser', JSON.stringify(profile)); window.dispatchEvent(new Event('auth-change'));
    }).catch((requestError) => setError(requestError.message));
  }, [navigate, token, storedUser?.id]);
  const logout = () => { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); window.dispatchEvent(new Event('auth-change')); navigate('/'); };
  const updateMarketing = async (marketingConsent) => {
    setSavingPreference(true); setError('');
    try {
      const response = await apiFetch('/api/auth/profile/marketing-preferences', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ marketingConsent }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to update marketing preferences.');
      setUser((current) => { const next = { ...current, marketingConsent: data.marketingConsent }; localStorage.setItem('authUser', JSON.stringify(next)); return next; }); setEmailNotice('Email preferences saved.');
    } catch (requestError) { setError(requestError.message); } finally { setSavingPreference(false); }
  };
  const updateTimezonePreference = async (timezoneDisplayMode, preferredTimezone = null) => {
    setSavingPreference(true); setError('');
    try {
      const response = await apiFetch('/api/auth/profile/timezone-preference', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ timezoneDisplayMode, preferredTimezone }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to update timezone preference.');
      setUser((current) => { const next = { ...current, ...data }; localStorage.setItem('authUser', JSON.stringify(next)); window.dispatchEvent(new Event('auth-change')); return next; });
    } catch (requestError) { setError(requestError.message); } finally { setSavingPreference(false); }
  };
  const uploadPicture = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    setUploading(true); setError('');
    try {
      const body = new FormData(); body.append('profilePicture', file);
      const response = await apiFetch('/api/auth/profile/picture', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to upload profile picture.');
      const value = data.profilePicture || data.profilePictureUrl || data.user?.profilePicture || data.user?.profilePictureUrl;
      if (!value) throw new Error('The server did not return the profile picture URL.');
      setUser((current) => { const next = { ...current, profilePicture: profilePictureUrl(value) }; localStorage.setItem('authUser', JSON.stringify(next)); window.dispatchEvent(new Event('auth-change')); return next; });
    } catch (requestError) { setError(requestError.message); } finally { setUploading(false); event.target.value = ''; }
  };
  const downloadExport = async () => {
    setExporting(true); setError('');
    try {
      const response = await apiFetch('/api/auth/export', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to create your data export.');
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'ykcircle-data-export.json'; anchor.click(); URL.revokeObjectURL(url);
    } catch (requestError) { setError(requestError.message); } finally { setExporting(false); }
  };
  const deleteAccount = async () => {
    setDeleting(true); setError('');
    try {
      if (!deletePassword) throw new Error('Enter your current password to confirm account deletion.');
      const response = await apiFetch('/api/auth/profile', { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ password: deletePassword }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to delete account.');
      localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); window.dispatchEvent(new Event('auth-change')); navigate('/account-deleted');
    } catch (requestError) { setError(requestError.message); setDeleting(false); }
  };
  if (!user) return null;
  const emailChoices = [
    ['eventInvitations', 'Event invitations', 'Invitations sent to you by event organizers.'],
    ['groupInvitations', 'Group invitations', 'Invitations to join private groups.'],
    ['groupEventAnnouncements', 'New events from your groups', 'Announcements when a group you belong to publishes an event.'],
  ];
  return <SiteChrome><Helmet><title>My profile | YKCircle</title><meta name="robots" content="noindex" /></Helmet>
    <section className="mx-auto max-w-4xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-5"><label className="group relative shrink-0 cursor-pointer rounded-full focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-4" title="Change profile picture">
          {user.profilePicture ? <img src={user.profilePicture} alt="" className="h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24" /> : <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl font-medium text-primary sm:h-24 sm:w-24">{user.name?.charAt(0)}</span>}
          <span className="absolute -bottom-1 -right-1 rounded-full border-4 border-background bg-secondary p-2"><Camera className="h-4 w-4" aria-hidden="true" /></span><input aria-label="Change profile picture" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={uploadPicture} disabled={uploading} className="sr-only" />
        </label><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-widest text-primary">Your account</p><h1 className="mt-2 break-words text-3xl font-semibold tracking-tight sm:text-4xl">{user.name}</h1><p className="mt-2 break-all text-sm text-muted-foreground">{user.email}</p>{uploading && <p role="status" className="mt-1 text-xs text-muted-foreground">Uploading picture…</p>}</div></div>
        <button onClick={logout} className="min-h-11 rounded-xl border border-border px-5 text-sm font-medium hover:bg-secondary/50">Log out</button>
      </header>
      {error && <p role="alert" className="mt-6 rounded-xl bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
      <section className="mt-10 overflow-hidden rounded-2xl border border-border/70" aria-labelledby="email-preferences-title">
        <div className="flex items-start gap-3 border-b border-border/70 bg-secondary/20 p-5 sm:p-6"><Mail className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><div><h2 id="email-preferences-title" className="text-xl font-semibold">Emails, your way</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Choose what arrives in your inbox. You can still find your invitations and events on YKCircle.</p></div></div>
        <div className="divide-y divide-border/60 px-5 sm:px-6">
          {emailChoices.map(([key, title, description]) => <div key={key} className="flex items-center justify-between gap-5 py-5"><label htmlFor={key} className="cursor-pointer"><span className="block text-sm font-medium">{title}</span><span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{description}</span></label><Switch id={key} checked={emailPreferences?.[key] ?? true} disabled={!emailPreferences || savingEmail} onCheckedChange={value => updateEmailPreference(key, value)} /></div>)}
          <div className="flex items-center justify-between gap-5 py-5"><label htmlFor="marketing-emails" className="cursor-pointer"><span className="block text-sm font-medium">YKCircle news and offers</span><span className="mt-1 block text-sm text-muted-foreground">Occasional product news, ideas, and promotions.</span></label><Switch id="marketing-emails" checked={Boolean(user.marketingConsent)} disabled={savingPreference} onCheckedChange={updateMarketing} /></div>
        </div>
        <div className="border-t border-border/70 bg-secondary/20 px-5 py-4 sm:px-6"><p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />Account security, receipts, and essential registration updates are always sent.</p>{!emailPreferences && !emailError && <p role="status" className="mt-2 text-sm">Loading preferences…</p>}{emailError && <p role="alert" className="mt-2 text-sm text-destructive">{emailError}</p>}{emailNotice && <p role="status" className="mt-2 text-sm text-primary">{emailNotice}</p>}</div>
      </section>
      {product.subscriptionsEnabled && <Link to="/profile/subscriptions" className="mt-5 flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-border/70 p-5 transition-colors hover:bg-secondary/30 sm:p-6"><div><h2 className="font-semibold">Your publishing plans</h2><p className="mt-1 text-sm text-muted-foreground">Article space and event publishing subscriptions.</p></div><ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" /></Link>}
      {paidFeatures && <details className="group mt-5 overflow-hidden rounded-2xl border border-border/70">
        <summary className="flex cursor-pointer list-none items-center gap-4 p-5 transition-colors hover:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:p-6 [&::-webkit-details-marker]:hidden"><span className="rounded-xl bg-secondary/60 p-3"><Building2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" /></span><span className="flex-1"><span className="block font-semibold">Organizations & payments</span><span className="mt-1 block text-sm text-muted-foreground">For when you organize, host, or do business.</span></span><ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
        <div className="grid gap-3 border-t border-border/70 bg-secondary/15 p-5 sm:grid-cols-2 sm:p-6">
          {[['/account/organizations', 'Organizations', 'Manage your teams and organization details.', Building2], ['/account/payments', 'Payments & business', 'Billing details, invoices, and payment settings.', CreditCard]].map(([to, title, description, Icon]) => <Link key={to} to={to} className="group/link rounded-xl border border-border/70 bg-background p-5 transition-colors hover:border-primary/40"><div className="flex items-center justify-between"><Icon className="h-5 w-5 text-primary" aria-hidden="true" /><ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover/link:text-primary" aria-hidden="true" /></div><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p></Link>)}
        </div>
      </details>}
      <section className="mt-10 border-t border-border/70 pt-7"><h2 className="text-lg font-semibold">Privacy and account</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Download a copy of your personal data or manage your account.</p><div className="mt-4 flex flex-wrap gap-3"><button disabled={exporting} onClick={downloadExport} className="min-h-11 rounded-xl border border-border px-5 text-sm disabled:opacity-50">{exporting ? 'Preparing export…' : 'Download my data'}</button><button onClick={() => setConfirmingDelete(true)} className="min-h-11 rounded-xl px-5 text-sm text-destructive hover:bg-destructive/5">Delete account</button></div></section>
    </section>{confirmingDelete && <ConfirmationDialog title="Delete your account?" description="This permanently removes your account and eligible content. Confirm with your password." confirmLabel="Delete account" destructive busy={deleting} onCancel={() => { setConfirmingDelete(false); setDeletePassword(''); }} onConfirm={deleteAccount}><input autoFocus required type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} placeholder="Current password" aria-label="Current password" className="w-full border border-border bg-background p-3" /></ConfirmationDialog>}</SiteChrome>;
}
