import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import SiteChrome from '@/components/SiteChrome';
import { apiFetch } from '@/lib/api';

const statuses = ['submitted', 'under_review', 'resolved', 'dismissed'];
const label = (value) => String(value || '').replaceAll('_', ' ');

export default function AdminReportsPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('authUser') || 'null');
  const [status, setStatus] = useState('submitted');
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);

  const load = async () => {
    setError('');
    try {
      const response = await apiFetch(`/api/admin/reports?status=${encodeURIComponent(status)}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load reports.');
      setReports(Array.isArray(data) ? data : data.reports || []);
    } catch (requestError) { setError(requestError.message); }
  };

  useEffect(() => {
    if (!token || user?.role !== 'admin') { navigate('/profile', { replace: true }); return; }
    void load();
  }, [status, token, user?.role]);

  const update = async (id, nextStatus) => {
    setSaving(id); setError('');
    try {
      const response = await apiFetch(`/api/admin/reports/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update report status.');
      if (nextStatus !== status) setReports((current) => current.filter((report) => report.id !== id));
      else setReports((current) => current.map((report) => report.id === id ? { ...report, status: nextStatus, reviewedAt: new Date().toISOString() } : report));
    } catch (requestError) { setError(requestError.message); } finally { setSaving(null); }
  };

  return <SiteChrome><Helmet><title>Content reports | YKCircle</title><meta name="robots" content="noindex" /></Helmet><section className="mx-auto max-w-[72rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs uppercase tracking-[0.3em] text-primary">Admin area</p><h1 className="mt-3 font-display text-5xl font-black">Content reports</h1><p className="mt-4 max-w-2xl text-muted-foreground">Review reports submitted for events, groups, profiles, images, and venues.</p></div><label className="text-sm">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="ml-3 min-h-11 border border-border bg-background px-3">{statuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label></div><div className="mt-6 flex flex-wrap gap-4 text-sm"><Link to="/appeal" className="text-primary underline">Appeal form</Link></div>{error && <p role="alert" className="mt-6 text-destructive">{error}</p>}<div className="mt-10 space-y-4">{reports.map((report) => <article key={report.id} className="rounded-2xl border border-border p-5"><div className="flex flex-wrap items-start justify-between gap-5"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary"><span>{label(report.entityType)}</span><span>·</span><span>{label(report.reasonCode)}</span>{report.allegedIllegal && <><span>·</span><span className="text-destructive">Alleged illegal content</span></>}</div><h2 className="mt-3 font-display text-2xl">Report {report.reference}</h2><dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="inline text-muted-foreground">Content ID: </dt><dd className="inline break-all">{report.entityId || 'Not provided'}</dd></div><div><dt className="inline text-muted-foreground">Reporter: </dt><dd className="inline break-all">{report.reporterEmail || 'Anonymous'}</dd></div><div><dt className="inline text-muted-foreground">Submitted: </dt><dd className="inline">{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'Unknown'}</dd></div>{report.contentUrl && <div><dt className="inline text-muted-foreground">Content: </dt><dd className="inline"><a href={report.contentUrl} target="_blank" rel="noreferrer" className="break-all text-primary underline">Open reported content</a></dd></div>}</dl><p className="mt-5 whitespace-pre-wrap leading-relaxed">{report.description}</p></div><label className="min-w-40 text-sm">Review status<select value={report.status} disabled={saving === report.id} onChange={(event) => update(report.id, event.target.value)} className="mt-2 min-h-11 w-full border border-border bg-background px-3">{statuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label></div></article>)}{reports.length === 0 && !error && <p className="mt-8 text-muted-foreground">No {label(status)} reports.</p>}</div></section></SiteChrome>;
}
