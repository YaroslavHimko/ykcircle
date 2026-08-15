import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import SiteChrome from '@/components/SiteChrome';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { apiAssetUrl, apiFetch } from '@/lib/api';
import { backendDate } from '@/lib/utils';

const profilePictureUrl = (value) => {
  if (!value) return '';
  if (!/^https?:\/\//i.test(value) && !value.startsWith('/')) return apiAssetUrl(`/uploads/profile-pictures/${value}`);
  try {
    const parsed = new URL(value, window.location.origin);
    if (parsed.pathname.startsWith('/uploads/profile-pictures/')) return apiAssetUrl(parsed.pathname);
    return parsed.toString();
  } catch { return value; }
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  const [user, setUser] = useState(storedUser); const token = localStorage.getItem('authToken');
  const [applications, setApplications] = useState([]); const [adminApplications, setAdminApplications] = useState([]);
  const [error, setError] = useState(''); const [uploading, setUploading] = useState(false); const [savingEmailPreferences, setSavingEmailPreferences] = useState(false); const [confirmingAccountDeletion, setConfirmingAccountDeletion] = useState(false);
  const canManage = ['admin', 'manager'].includes(user?.role);
  useEffect(() => {
    if (!token || !storedUser) { navigate('/login', { replace: true, state: { from: '/profile' } }); return; }
    const headers = { Authorization: `Bearer ${token}` }; const requests = [apiFetch('/api/auth/profile', { headers }), apiFetch('/api/applications', { headers })];
    if (['admin', 'manager'].includes(storedUser.role)) requests.push(apiFetch('/api/admin/applications', { headers }));
    Promise.all(requests).then(async ([profileResponse, applicationsResponse, adminResponse]) => {
      const profileData = await profileResponse.json(); const applicationsData = await applicationsResponse.json();
      if (!profileResponse.ok) throw new Error(profileData.error || 'Unable to load profile data.'); if (!applicationsResponse.ok) throw new Error(applicationsData.error || 'Unable to load applications.');
      const profile = profileData.user || profileData; const picture = profile.profilePicture || profile.profilePictureUrl || profile.profile_picture || profile.avatar || storedUser.profilePicture; const normalizedProfile = { ...profile, profilePicture: profilePictureUrl(picture) }; setUser(normalizedProfile); localStorage.setItem('authUser', JSON.stringify(normalizedProfile)); window.dispatchEvent(new Event('auth-change')); setApplications([...applicationsData].sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0)));
      if (adminResponse) { const adminData = await adminResponse.json(); if (!adminResponse.ok) throw new Error(adminData.error || 'Unable to load admin applications.'); setAdminApplications([...adminData].sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0))); }
    }).catch((requestError) => setError(requestError.message));
  }, [navigate, token, storedUser?.id, storedUser?.role]);
  const uploadPicture = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    setUploading(true); setError(''); const body = new FormData(); body.append('profilePicture', file);
    try { const response = await apiFetch('/api/auth/profile/picture', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to upload profile picture.'); const picture = data.profilePicture || data.profilePictureUrl || data.profile_picture || data.user?.profilePicture || data.user?.profilePictureUrl || data.user?.profile_picture; if (!picture) throw new Error('The profile picture was uploaded, but the server did not return its URL.'); const nextUser = { ...user, profilePicture: profilePictureUrl(picture) }; setUser(nextUser); localStorage.setItem('authUser', JSON.stringify(nextUser)); window.dispatchEvent(new Event('auth-change')); }
    catch (requestError) { setError(requestError.message); } finally { setUploading(false); event.target.value = ''; }
  };
  const updateEmailPreferences = async (enabled, checkbox) => {
    const previous = !enabled; setSavingEmailPreferences(true); setError('');
    try {
      const response = await apiFetch('/api/auth/profile/email-preferences', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ receiveEmailNotifications: enabled }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to update email preferences.');
      setUser((current) => ({ ...current, receivesEmailNotifications: data.receivesEmailNotifications ?? enabled }));
    } catch (requestError) { checkbox.checked = previous; setError(requestError.message); } finally { setSavingEmailPreferences(false); }
  };
  useEffect(() => {
    const grid = document.querySelector('section div.grid');
    if (!grid) return;
    const existing = grid.querySelector('.email-preferences input');
    if (existing) { existing.checked = Boolean(user?.receivesEmailNotifications); existing.disabled = savingEmailPreferences; return; }
    const label = document.createElement('label'); label.className = 'email-preferences mt-4 flex items-center gap-3 text-sm sm:col-span-2';
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = Boolean(user?.receivesEmailNotifications); checkbox.disabled = savingEmailPreferences; checkbox.className = 'h-4 w-4 accent-primary';
    checkbox.onchange = () => updateEmailPreferences(checkbox.checked, checkbox);
    label.append(checkbox, 'Receive email notifications'); grid.appendChild(label);
  }, [user?.receivesEmailNotifications, savingEmailPreferences]);
  const logout = () => { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); window.dispatchEvent(new Event('auth-change')); navigate('/'); };
  const deleteAccount = async () => { setError(''); try { const response = await apiFetch('/api/auth/profile', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to delete account.'); localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); window.dispatchEvent(new Event('auth-change')); navigate('/account-deleted'); } catch (requestError) { setError(requestError.message); } };
  if (!user) return null;
  return <SiteChrome><Helmet><title>My profile | Yaro Himko</title></Helmet><section className="mx-auto max-w-[56rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><div className="flex flex-wrap items-end justify-between gap-5"><div className="flex items-center gap-4"><label htmlFor="profile-picture-upload" title="Change profile picture" className="group relative block cursor-pointer overflow-hidden rounded-full shadow-sm"><span className="block">{user.profilePicture ? <img src={user.profilePicture} alt={`${user.name}'s profile picture`} onError={() => setUser((current) => ({ ...current, profilePicture: '' }))} className="h-20 w-20 rounded-full object-cover" /> : <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-2xl">{user.name?.charAt(0)}</span>}</span><span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/35 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0 2 2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></span></label><div><p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">Member profile</p><h1 className="mt-2 font-display text-5xl font-black leading-[0.95]">{user.name}</h1></div></div><div className="flex flex-wrap gap-3"><button onClick={logout} className="border border-border px-5 py-3 text-sm uppercase tracking-widest">Log out</button><button onClick={() => setConfirmingAccountDeletion(true)} className="border border-destructive px-5 py-3 text-sm uppercase tracking-widest text-destructive">Delete account</button></div></div><div className="sr-only"><label>{uploading ? 'Uploading…' : 'Change profile picture'}<input id="profile-picture-upload" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={uploadPicture} disabled={uploading} /></label></div><div className="mt-10 grid gap-4 border-y border-border py-6 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">Email</span><br />{user.email}</p><p><span className="text-muted-foreground">Phone</span><br />{user.phone || 'Not provided'}</p></div>{error && <p className="mt-5 text-destructive">{error}</p>}<h2 className="mt-12 font-display text-3xl font-semibold">Your applications</h2>{applications.length === 0 ? <p className="mt-5 text-muted-foreground">No applications yet. <Link className="text-primary underline" to="/contact">Send an enquiry</Link>.</p> : <div className="mt-5 space-y-3">{applications.map((application) => <div key={application.id} className="border border-border p-5"><div className="flex justify-between gap-4"><p className="font-medium">{application.activity}</p><span className="text-sm text-primary">{application.status}</span></div><p className="mt-2 text-sm text-muted-foreground">Submitted {backendDate(application.createdAt)?.toLocaleDateString()}</p>{application.additionalInformation && <p className="mt-3 border-t border-border pt-3 text-sm">{application.additionalInformation}</p>}</div>)}</div>}{canManage && <><h2 className="mt-12 font-display text-3xl font-semibold">All applications</h2><div className="mt-5 space-y-3">{adminApplications.map((application) => <div key={application.id} className="border border-border p-5"><div className="flex justify-between gap-4"><div><p className="font-medium">{application.name}</p><p className="text-sm text-muted-foreground">{application.email} · {application.activity}</p></div><span className="text-sm text-primary">{application.status}</span></div></div>)}</div><Link className="mt-5 inline-block text-primary underline" to="/admin/applications">Manage application statuses</Link></>}</section>{confirmingAccountDeletion && <ConfirmationDialog title="Delete your account?" description="Your account and its data will be permanently deleted. This cannot be undone." confirmLabel="Delete account" destructive onCancel={() => setConfirmingAccountDeletion(false)} onConfirm={deleteAccount} />}</SiteChrome>;
}
