import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import SiteChrome from '@/components/SiteChrome';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { apiAssetUrl, apiFetch } from '@/lib/api';
import { deviceTimezone } from '@/lib/time';

const profilePictureUrl = (value) => {
  if (!value) return '';
  if (!/^https?:\/\//i.test(value) && !value.startsWith('/')) return apiAssetUrl(`/uploads/profile-pictures/${value}`);
  try { const parsed = new URL(value, window.location.origin); return parsed.pathname.startsWith('/uploads/profile-pictures/') ? apiAssetUrl(parsed.pathname) : parsed.toString(); }
  catch { return value; }
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const storedUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  const [user, setUser] = useState(storedUser);
  const [error, setError] = useState('');
  const [savingPreference, setSavingPreference] = useState(false);
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
      setUser((current) => ({ ...current, marketingConsent: data.marketingConsent }));
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
  return <SiteChrome><Helmet><title>My profile | YKCircle</title><meta name="robots" content="noindex" /></Helmet><section className="mx-auto max-w-[56rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><div className="flex flex-wrap items-end justify-between gap-5"><div className="flex items-center gap-4"><label className="cursor-pointer" title="Change profile picture">{user.profilePicture ? <img src={user.profilePicture} alt="" className="h-20 w-20 rounded-full object-cover" /> : <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-2xl">{user.name?.charAt(0)}</span>}<input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={uploadPicture} disabled={uploading} className="sr-only" /></label><div><p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">Member profile</p><h1 className="mt-2 font-display text-5xl font-black leading-[0.95]">{user.name}</h1><p className="mt-1 text-xs text-muted-foreground">{uploading ? 'Uploading picture…' : 'Select your picture to change it'}</p></div></div><button onClick={logout} className="border border-border px-5 py-3 text-sm uppercase tracking-widest">Log out</button></div><div className="mt-7 flex flex-wrap gap-3"><Link to="/profile/my-events" className="inline-flex min-h-11 items-center border border-border px-5 py-2 text-sm">My events</Link><Link to="/profile/subscriptions" className="inline-flex min-h-11 items-center border border-border px-5 py-2 text-sm">My subscriptions</Link>{['admin','manager'].includes(user.role) && <Link to="/admin/configuration" className="inline-flex min-h-11 items-center border border-border px-5 py-2 text-sm">Configuration</Link>}</div><div className="mt-10 grid gap-4 border-y border-border py-6 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">Email</span><br />{user.email}</p><p><span className="text-muted-foreground">Marketing updates</span><br /><label className="mt-2 flex items-center gap-3"><input type="checkbox" checked={Boolean(user.marketingConsent)} disabled={savingPreference} onChange={(event) => updateMarketing(event.target.checked)} />Receive optional YKCircle news</label></p></div>{error && <p role="alert" className="mt-5 text-destructive">{error}</p>}<section className="mt-12 border border-border p-6"><h2 className="font-display text-3xl font-semibold">Privacy and account</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Download a machine-readable copy of the personal data available in your account, or permanently delete your account and eligible content.</p><div className="mt-6 flex flex-wrap gap-3"><button disabled={exporting} onClick={downloadExport} className="min-h-11 border border-border px-5 text-sm disabled:opacity-50">{exporting ? 'Preparing export…' : 'Download my data'}</button><button onClick={() => setConfirmingDelete(true)} className="min-h-11 border border-destructive px-5 text-sm text-destructive">Delete account</button></div></section></section>{confirmingDelete && <ConfirmationDialog title="Delete your account?" description="This permanently removes your account and eligible content. Confirm with your password." confirmLabel="Delete account" destructive busy={deleting} onCancel={() => { setConfirmingDelete(false); setDeletePassword(''); }} onConfirm={deleteAccount}><input autoFocus required type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} placeholder="Current password" aria-label="Current password" className="w-full border border-border bg-background p-3" /></ConfirmationDialog>}</SiteChrome>;
}
