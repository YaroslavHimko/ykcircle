import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import SiteChrome from '@/components/SiteChrome';
import { apiFetch } from '@/lib/api';

export default function AdminApplicationsPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('authUser') || 'null');
  const token = localStorage.getItem('authToken');
  const [applications, setApplications] = useState([]); const [statuses, setStatuses] = useState([]);
  const [error, setError] = useState(''); const [saving, setSaving] = useState(null);
  const loadApplications = useCallback(async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const [applicationsResponse, statusesResponse] = await Promise.all([apiFetch('/api/admin/applications', { headers }), apiFetch('/api/application-statuses')]);
    const applicationsData = await applicationsResponse.json(); const statusesData = await statusesResponse.json();
    if (!applicationsResponse.ok) throw new Error(applicationsData.error || 'Unable to load applications.');
    if (!statusesResponse.ok) throw new Error(statusesData.error || 'Unable to load application statuses.');
    setApplications([...applicationsData].sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0))); setStatuses(statusesData);
  }, [token]);
  useEffect(() => {
    if (!token || !user) return navigate('/login', { replace: true, state: { from: '/admin/applications' } });
    if (!['admin', 'manager'].includes(user.role)) return navigate('/profile', { replace: true });
    loadApplications().catch((requestError) => setError(requestError.message));
  }, [loadApplications, navigate, token, user?.role]);
  const updateStatus = async (id, status) => {
    setSaving(id); setError('');
    try {
      const response = await apiFetch(`/api/applications/${id}/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to update status.');
      setApplications((current) => current.map((application) => application.id === id ? { ...application, status } : application));
    } catch (requestError) { setError(requestError.message); } finally { setSaving(null); }
  };
  const reviewOrganizer = async (id, status) => {
    setSaving(id); setError('');
    try {
      const response = await apiFetch(`/api/admin/applications/${id}/organizer-review`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to review organizer application.');
      setApplications((current) => current.map((application) => application.id === id ? { ...application, status: data.status || status } : application));
    } catch (requestError) { setError(requestError.message); } finally { setSaving(null); }
  };
  const renderTable = (items, organizerReview = false) => <div className="mt-5 overflow-x-auto border border-border"><table className="w-full min-w-[50rem] text-left text-sm"><thead className="bg-secondary/60 text-xs uppercase tracking-widest"><tr><th className="px-4 py-4">Applicant</th><th className="px-4 py-4">Contact</th><th className="px-4 py-4">Activity</th><th className="px-4 py-4">Additional information</th><th className="px-4 py-4">Submitted</th><th className="px-4 py-4">{organizerReview ? 'Review' : 'Status'}</th></tr></thead><tbody>{items.map((application) => <tr key={application.id} className="border-t border-border align-top"><td className="px-4 py-5"><p className="font-medium">{application.name}</p><p className="mt-1 text-muted-foreground">{application.email}</p></td><td className="px-4 py-5">{application.contact || '—'}</td><td className="px-4 py-5">{application.activity}</td><td className="max-w-xs px-4 py-5 text-muted-foreground">{application.additionalInformation || '—'}</td><td className="whitespace-nowrap px-4 py-5 text-muted-foreground">{new Date(application.createdAt).toLocaleDateString()}</td><td className="px-4 py-5">{organizerReview && !['Approved', 'Declined'].includes(application.status) ? <div className="flex flex-wrap gap-2"><button type="button" disabled={saving === application.id} onClick={() => reviewOrganizer(application.id, 'Approved')} className="min-h-10 bg-primary px-3 text-xs uppercase tracking-widest text-primary-foreground disabled:opacity-50">Approve</button><button type="button" disabled={saving === application.id} onClick={() => reviewOrganizer(application.id, 'Declined')} className="min-h-10 border border-destructive px-3 text-xs uppercase tracking-widest text-destructive disabled:opacity-50">Reject</button></div> : organizerReview ? <span className="text-primary">{application.status}</span> : <select value={application.status} disabled={saving === application.id} onChange={(event) => updateStatus(application.id, event.target.value)} className="min-h-10 border border-border bg-background px-3"><option disabled value="">Select status</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>}</td></tr>)}</tbody></table></div>;
  const organizerApplications = applications.filter((application) => application.activity?.trim().toLowerCase() === 'event organizer');
  const otherApplications = applications.filter((application) => application.activity?.trim().toLowerCase() !== 'event organizer');
  if (!['admin', 'manager'].includes(user?.role)) return null;
  return <SiteChrome><Helmet><title>Manage applications | Yaro Himko</title></Helmet><section className="mx-auto max-w-[76rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">Admin area</p><div className="mt-4 flex flex-wrap items-end justify-between gap-5"><h1 className="font-display text-5xl font-black leading-[0.95]">Applications</h1><Link to="/profile" className="border border-border px-5 py-3 text-sm uppercase tracking-widest">View profile</Link></div>{error && <p className="mt-6 text-destructive">{error}</p>}{!error && applications.length === 0 && <p className="mt-10 text-muted-foreground">No applications have been submitted yet.</p>}{organizerApplications.length > 0 && <section className="mt-10"><h2 className="font-display text-3xl font-semibold">Event Organizer Applications</h2>{renderTable(organizerApplications, true)}</section>}{otherApplications.length > 0 && <section className="mt-14"><h2 className="font-display text-3xl font-semibold">Other Applications</h2>{renderTable(otherApplications)}</section>}</section></SiteChrome>;
}
