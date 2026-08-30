import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "react-router-dom";
import SiteChrome from "@/components/SiteChrome";
import { apiFetch } from "@/lib/api";

const initialForm = (search = "") => {
  const params = new URLSearchParams(search);
  return {
  entityType: params.get("entityType") || "",
  entityId: params.get("entityId") || "",
  contentUrl: params.get("contentUrl") || window.location.href,
  reasonCode: "",
  description: "",
  supportingDetails: "",
  reporterEmail: "",
  allegedIllegal: false,
  goodFaithDeclared: false,
  };
};

export default function ReportPage() {
  const location = useLocation();
  const [form, setForm] = useState(() => initialForm(location.search));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  const update = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setReference("");
    try {
      const token = localStorage.getItem("authToken");
      const response = await apiFetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          entityType: form.entityType,
          entityId: form.entityId.trim() || null,
          contentUrl: form.contentUrl.trim() || null,
          reasonCode: form.reasonCode,
          description: form.description.trim(),
          supportingDetails: form.supportingDetails.trim() || null,
          reporterEmail: form.reporterEmail.trim(),
          allegedIllegal: form.allegedIllegal,
          goodFaithDeclared: form.goodFaithDeclared,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to submit this report.");
      setReference(result.reference);
    } catch (requestError) {
      setError(requestError.message || "Unable to submit this report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteChrome>
      <Helmet><title>Report content | YKCircle</title><meta name="robots" content="noindex" /></Helmet>
      <section className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Safety</p>
        <h1 className="mt-3 font-display text-5xl font-black">Report content</h1>
        <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">Use this form to report content you believe breaches our rules or may be illegal. You can submit a report without signing in.</p>
        <p className="mt-5 border border-amber-500/50 bg-amber-500/10 p-4 text-sm leading-relaxed">This reporting flow and the related legal documents are draft templates in development. No real data is provided yet, and the legal materials still require Swedish legal review before launch.</p>

        {reference ? (
          <div className="mt-10 border border-primary bg-primary/5 p-6" role="status">
            <h2 className="font-display text-3xl">Report received</h2>
            <p className="mt-3 text-muted-foreground">Keep this reference for any follow-up about your report.</p>
            <p className="mt-4 font-mono text-lg font-semibold text-primary">{reference}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10 space-y-6">
            <label className="block text-sm">Content type<select required name="entityType" value={form.entityType} onChange={update} className="mt-2 min-h-12 w-full border border-border bg-background px-4"><option value="">Select content type</option><option value="image">Image</option><option value="event">Event</option><option value="group">Group</option><option value="venue">Venue</option><option value="review">Review</option><option value="profile">Profile</option><option value="organization">Organization</option></select></label>
            <label className="block text-sm">Content ID <span className="text-muted-foreground">(optional if you provide a URL)</span><input name="entityId" value={form.entityId} onChange={update} className="mt-2 min-h-12 w-full border border-border bg-background px-4" /></label>
            <label className="block text-sm">Content URL <span className="text-muted-foreground">(optional if you provide an ID)</span><input name="contentUrl" type="url" value={form.contentUrl} onChange={update} className="mt-2 min-h-12 w-full border border-border bg-background px-4" /></label>
            <label className="block text-sm">Reason<select required name="reasonCode" value={form.reasonCode} onChange={update} className="mt-2 min-h-12 w-full border border-border bg-background px-4"><option value="">Select a reason</option><option value="illegal_content">Suspected illegal content</option><option value="harassment">Harassment or abuse</option><option value="unsafe_event">Unsafe event</option><option value="scam_fraud">Fraud or scam</option><option value="privacy">Privacy concern</option><option value="other">Other</option></select></label>
            <label className="block text-sm">Explain the concern<textarea required name="description" value={form.description} onChange={update} rows="5" className="mt-2 w-full border border-border bg-background px-4 py-3" /></label>
            <label className="block text-sm">Supporting details <span className="text-muted-foreground">(optional)</span><textarea name="supportingDetails" value={form.supportingDetails} onChange={update} rows="3" className="mt-2 w-full border border-border bg-background px-4 py-3" /></label>
            <p className="border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">Please do not upload or send suspected illegal imagery through this form. Describe the content and provide its ID or URL instead.</p>
            <label className="block text-sm">Email address<input required type="email" name="reporterEmail" value={form.reporterEmail} onChange={update} className="mt-2 min-h-12 w-full border border-border bg-background px-4" /></label>
            <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="allegedIllegal" checked={form.allegedIllegal} onChange={update} className="mt-1 h-4 w-4" /><span>I believe this content may be illegal.</span></label>
            <label className="flex items-start gap-3 text-sm"><input required type="checkbox" name="goodFaithDeclared" checked={form.goodFaithDeclared} onChange={update} className="mt-1 h-4 w-4" /><span>I declare in good faith that the information in this report is accurate to the best of my knowledge.</span></label>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <button disabled={submitting} className="min-h-12 bg-primary px-7 text-sm font-medium uppercase tracking-widest text-primary-foreground disabled:opacity-60">{submitting ? "Submitting…" : "Submit report"}</button>
          </form>
        )}
      </section>
    </SiteChrome>
  );
}
