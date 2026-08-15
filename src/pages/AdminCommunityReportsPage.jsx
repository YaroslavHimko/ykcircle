import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useNavigate } from "react-router-dom";
import SiteChrome from "@/components/SiteChrome";
import { communityHeaders, communityRequest, formatCommunityDate } from "@/lib/community";

export default function AdminCommunityReportsPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");
  const user = JSON.parse(localStorage.getItem("authUser") || "null");
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState("open");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(null);
  const load = async () => {
    try {
      setError("");
      const data = await communityRequest(`/api/admin/community/reports?status=${status}`, { headers: communityHeaders(token) });
      setReports(Array.isArray(data) ? data : data.reports || []);
    } catch (requestError) { setError(requestError.message); }
  };
  useEffect(() => {
    if (!token || user?.role !== "admin") { navigate("/profile", { replace: true }); return; }
    load();
  }, [status, token, user?.role]);
  const update = async (id, nextStatus) => {
    setSaving(id);
    try {
      await communityRequest(`/api/admin/community/reports/${id}`, { method: "PATCH", headers: communityHeaders(token, true), body: JSON.stringify({ status: nextStatus }) });
      setReports((current) => current.filter((item) => item.id !== id));
    } catch (requestError) { setError(requestError.message); } finally { setSaving(null); }
  };
  return <SiteChrome><Helmet><title>Community reports | YKCircle</title><meta name="robots" content="noindex" /></Helmet><section className="mx-auto max-w-[72rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs uppercase tracking-[0.3em] text-primary">Admin area</p><h1 className="mt-3 font-display text-5xl font-black">Community reports</h1></div><label className="text-sm">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="ml-3 min-h-11 border border-border bg-background px-3"><option value="open">Open</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></label></div>{error && <p role="alert" className="mt-6 text-destructive">{error}</p>}<div className="mt-10 space-y-3">{reports.map((report) => <article key={report.id} className="border border-border p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-primary">{report.reason}</p><h2 className="mt-2 font-display text-2xl"><Link to={`/stockholm/community/post/${report.postSlug}`} className="hover:text-primary">{report.postTitle}</Link></h2><p className="mt-2 text-sm text-muted-foreground">Reported by {report.reporterName} · {formatCommunityDate(report.createdAt)}</p>{report.details && <p className="mt-4 text-sm leading-relaxed">{report.details}</p>}</div><div className="flex gap-2"><button type="button" disabled={saving === report.id} onClick={() => update(report.id, "resolved")} className="min-h-10 border border-primary px-4 text-sm text-primary">Resolve</button><button type="button" disabled={saving === report.id} onClick={() => update(report.id, "dismissed")} className="min-h-10 border border-border px-4 text-sm">Dismiss</button></div></div></article>)}{reports.length === 0 && <p className="mt-8 text-muted-foreground">No {status} reports.</p>}</div></section></SiteChrome>;
}
