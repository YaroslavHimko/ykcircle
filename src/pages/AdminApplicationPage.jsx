import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SiteChrome from '@/components/SiteChrome';
import { apiFetch } from '@/lib/api';

export default function AdminApplicationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('authUser') || 'null');
  const token = localStorage.getItem('authToken');
  const [application, setApplication] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !user) return navigate('/login', { replace: true, state: { from: `/admin/applications/${id}` } });
    if (!['admin', 'manager'].includes(user.role)) return navigate('/profile', { replace: true });
    Promise.all([
      apiFetch(`/api/admin/applications/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
      apiFetch('/api/application-statuses'),
    ])
      .then(async ([applicationResponse, statusesResponse]) => {
        const data = await applicationResponse.json();
        const statusesData = await statusesResponse.json();
        if (!applicationResponse.ok) throw new Error(data.error || 'Unable to load application.');
        if (!statusesResponse.ok) throw new Error(statusesData.error || 'Unable to load application statuses.');
        setApplication(data);
        setStatus(data.status);
        setStatuses(statusesData);
      })
      .catch((requestError) => setError(requestError.message));
  }, [id, navigate, token, user?.role]);

  const updateStatus = async (event) => {
    const nextStatus = event.target.value;
    setStatus(nextStatus); setSaving(true); setError('');
    try {
      const response = await apiFetch(`/api/applications/${id}/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update application status.');
      setApplication((current) => ({ ...current, status: nextStatus }));
    } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };

  return <SiteChrome><Helmet><title>Application | Yaro Himko</title></Helmet><section className="mx-auto max-w-[56rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><Link to="/admin/applications" className="text-sm text-primary underline">← All applications</Link><p className="mt-10 text-[0.7rem] uppercase tracking-[0.35em] text-primary">Application #{id}</p>{error && <p className="mt-5 text-destructive">{error}</p>}{application && <><h1 className="mt-4 font-display text-5xl font-black leading-[0.95]">{application.name}</h1><div className="mt-10 divide-y divide-border border-y border-border text-sm"><p className="py-5"><span className="text-muted-foreground">Email</span><br />{application.email}</p><p className="py-5"><span className="text-muted-foreground">Phone</span><br />{application.contact || 'Not provided'}</p><p className="py-5"><span className="text-muted-foreground">Activity</span><br />{application.activity}</p><p className="py-5"><span className="text-muted-foreground">Additional information</span><br />{application.additionalInformation || 'None provided'}</p><p className="py-5"><span className="text-muted-foreground">Submitted</span><br />{new Date(application.createdAt).toLocaleString()}</p></div><label className="mt-10 block text-sm">Application status<select value={status} disabled={saving} onChange={updateStatus} className="mt-2 min-h-12 w-full border border-border bg-background px-4">{statuses.map((option) => <option key={option}>{option}</option>)}</select></label>{saving && <p className="mt-3 text-sm text-muted-foreground">Saving status…</p>}</>}</section></SiteChrome>;
}
