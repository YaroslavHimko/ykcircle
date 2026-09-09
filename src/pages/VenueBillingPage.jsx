import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";
import SiteChrome from "@/components/SiteChrome";
import { apiFetch } from "@/lib/api";

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("authToken")}` });
const paymentMethods = [["bank_transfer", "Bank transfer"], ["bankgiro", "Bankgiro"], ["plusgiro", "Plusgiro"], ["swish", "Swish"], ["cash", "Cash"], ["other", "Other"]];
const empty = { invoiceMode: "ykcircle", sellerBillingProfileId: "", paymentTermsDays: 30, taxMode: "no_tax", defaultTaxRate: "", pricesIncludeTax: false, confirmationPolicy: "on_owner_approval", methods: [], bankgiro: "", plusgiro: "", iban: "", bic: "", swishNumber: "", bankName: "", accountDetailsText: "", additionalInstructions: "", paymentReferenceMode: "invoice_number", acceptInvoiceAuthorization: false, termsVersion: "venue-invoicing-2026-09-09" };
const input = "mt-2 min-h-11 w-full border border-border bg-background px-3";
const errorText = (data, fallback) => [data?.error || data?.message, data?.fields && Object.entries(data.fields).map(([key, value]) => `${key}: ${value}`).join(" ")].filter(Boolean).join(" ") || fallback;

export default function VenueBillingPage() {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState(empty);
  const [readiness, setReadiness] = useState(null);
  const [state, setState] = useState({ loading: true, saving: false, error: "", notice: "" });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const headers = auth();
      const [venueResponse, profilesResponse, settingsResponse, readinessResponse] = await Promise.all([
        apiFetch(`/api/venues/${id}`, { headers }), apiFetch("/api/me/billing-profiles", { headers }),
        apiFetch(`/api/venues/${id}/financial-settings`, { headers }), apiFetch(`/api/venues/${id}/financial-readiness`, { headers }),
      ]);
      const [venueData, profileData, settingsData, readinessData] = await Promise.all([venueResponse.json(), profilesResponse.json(), settingsResponse.json(), readinessResponse.json()]);
      if (!venueResponse.ok) throw new Error(errorText(venueData, "Unable to load Venue."));
      if (!profilesResponse.ok) throw new Error(errorText(profileData, "Unable to load Billing Profiles."));
      if (!settingsResponse.ok) throw new Error(errorText(settingsData, "Unable to load Venue billing settings."));
      setVenue(venueData.venue || venueData);
      setProfiles(Array.isArray(profileData) ? profileData : profileData.profiles || []);
      setForm({ ...empty, ...settingsData, sellerBillingProfileId: settingsData.sellerBillingProfileId || "", defaultTaxRate: settingsData.defaultTaxRate ?? "", methods: settingsData.methods || [], acceptInvoiceAuthorization: Boolean(settingsData.acceptedAt) });
      setReadiness(readinessResponse.ok ? readinessData : null);
    } catch (error) { setState((current) => ({ ...current, error: error.message })); }
    finally { setState((current) => ({ ...current, loading: false })); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const venueOrganizationId = form.organizationId || venue?.organizationId || null;
  const billingProfilePath = venueOrganizationId
    ? `/account/billing-profiles?new=organization&organizationId=${venueOrganizationId}&returnTo=${encodeURIComponent(`/profile/venues/${id}/billing`)}`
    : "/account/billing-profiles";
  const sellers = useMemo(() => profiles.filter((profile) => profile.profileType === "organization" && Number(profile.ownerOrganizationId) === Number(venueOrganizationId)), [profiles, venueOrganizationId]);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleMethod = (method) => set("methods", form.methods.includes(method) ? form.methods.filter((item) => item !== method) : [...form.methods, method]);
  const save = async (event) => {
    event.preventDefault(); setState((current) => ({ ...current, saving: true, error: "", notice: "" }));
    try {
      const response = await apiFetch(`/api/venues/${id}/financial-settings`, { method: "PUT", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify({ ...form, sellerBillingProfileId: form.sellerBillingProfileId ? Number(form.sellerBillingProfileId) : null, paymentTermsDays: Number(form.paymentTermsDays), defaultTaxRate: form.defaultTaxRate === "" ? null : Number(form.defaultTaxRate) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(errorText(data, "Unable to save Venue billing settings."));
      setState((current) => ({ ...current, saving: false, notice: "Booking and billing settings saved." })); await load();
    } catch (error) { setState((current) => ({ ...current, saving: false, error: error.message })); }
  };

  return <SiteChrome><Helmet><title>Booking & billing | YKCircle</title><meta name="robots" content="noindex" /></Helmet><section className="mx-auto max-w-4xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
    <Link to="/profile/venues" className="text-sm text-primary underline">Back to my venues</Link><p className="mt-6 text-xs uppercase tracking-[0.25em] text-primary">Manage Venue</p><h1 className="mt-2 font-display text-4xl font-bold">Booking & billing</h1>
    <p className="mt-3 text-muted-foreground">{venue?.name || "Venue"}. YKCircle can create invoices in your organization’s name; rental payments always go directly to your Venue.</p>
    {state.error && <p role="alert" className="mt-5 border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{state.error}</p>}{state.notice && <p className="mt-5 border border-primary/30 bg-primary/5 p-3 text-sm">{state.notice}</p>}
    {state.loading ? <p className="mt-8 text-muted-foreground">Loading billing settings…</p> : <form onSubmit={save} className="mt-8 space-y-8">
      <Section title="Invoice mode"><label className="flex gap-3"><input type="radio" checked={form.invoiceMode === "ykcircle"} onChange={() => set("invoiceMode", "ykcircle")} /><span><strong>Let YKCircle create invoices for me</strong><small className="mt-1 block text-muted-foreground">Invoices are generated on your organization’s behalf. No Stripe or payment-provider account is required.</small></span></label><label className="mt-4 flex gap-3"><input type="radio" checked={form.invoiceMode === "external"} onChange={() => set("invoiceMode", "external")} /><span><strong>I use my own accounting system</strong><small className="mt-1 block text-muted-foreground">Add an external invoice number and secure document link after approval.</small></span></label></Section>
      <Section title="Seller details"><label className="block text-sm font-medium">Organization Billing Profile<select value={form.sellerBillingProfileId} onChange={(event) => set("sellerBillingProfileId", event.target.value)} className={input}><option value="">Choose seller</option>{sellers.map((profile) => <option key={profile.id} value={profile.id}>{profile.legalName}</option>)}</select></label>{!sellers.length && <p className="mt-3 text-sm text-muted-foreground">{profiles.length ? "Your existing Billing Profile is personal or belongs to another organization. " : "No organization Billing Profile is available yet. "}<Link to={billingProfilePath} className="text-primary underline">Create an organization seller profile</Link> for this Venue. Personal profiles cannot be the seller for an organization Venue.</p>}</Section>
      {form.invoiceMode === "ykcircle" && <><Section title="Payment instructions"><div className="flex flex-wrap gap-4">{paymentMethods.map(([value, label]) => <label key={value} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.methods.includes(value)} onChange={() => toggleMethod(value)} />{label}</label>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Bankgiro" value={form.bankgiro} onChange={(value) => set("bankgiro", value)} /><Field label="Plusgiro" value={form.plusgiro} onChange={(value) => set("plusgiro", value)} /><Field label="IBAN" value={form.iban} onChange={(value) => set("iban", value)} /><Field label="BIC" value={form.bic} onChange={(value) => set("bic", value)} /><Field label="Swish number" value={form.swishNumber} onChange={(value) => set("swishNumber", value)} /><Field label="Bank name" value={form.bankName} onChange={(value) => set("bankName", value)} /><Area label="Account details / other method" value={form.accountDetailsText} onChange={(value) => set("accountDetailsText", value)} /><Area label="Additional invoice instructions" value={form.additionalInstructions} onChange={(value) => set("additionalInstructions", value)} /></div></Section>
      <Section title="Invoice and tax settings"><div className="grid gap-4 sm:grid-cols-2"><Field label="Payment terms (days)" type="number" value={form.paymentTermsDays} onChange={(value) => set("paymentTermsDays", value)} /><label className="text-sm font-medium">Tax treatment<select value={form.taxMode} onChange={(event) => set("taxMode", event.target.value)} className={input}><option value="no_tax">No VAT / tax configured</option><option value="configured">Configured tax rate</option></select></label>{form.taxMode === "configured" && <Field label="Tax rate (%)" type="number" value={form.defaultTaxRate} onChange={(value) => set("defaultTaxRate", value)} />}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.pricesIncludeTax} onChange={(event) => set("pricesIncludeTax", event.target.checked)} />Listed prices include tax</label></div><p className="mt-4 text-sm text-muted-foreground">The Venue seller is responsible for its legal identity, VAT status, rate, payment information, invoice accuracy, and accounting.</p></Section>
      <Section title="Authorization"><label className="flex gap-3 text-sm"><input type="checkbox" required={!form.acceptedAt} checked={form.acceptInvoiceAuthorization} onChange={(event) => set("acceptInvoiceAuthorization", event.target.checked)} /><span>I authorize YKCircle to generate and deliver invoices in the Venue seller’s name and on its behalf for bookings made through YKCircle.</span></label></Section></>}
      {readiness && <Section title="Readiness"><div className="flex flex-wrap gap-2">{[["Seller", readiness.sellerBillingProfileReady], ["Invoice series", readiness.invoiceSeriesReady], ["Payment instructions", readiness.paymentInstructionsReady], ["Tax", readiness.taxConfigurationReady], ["Authorization", readiness.termsAccepted]].map(([label, ready]) => <span key={label} className={`border px-2 py-1 text-xs ${ready ? "border-primary text-primary" : "border-amber-600 text-amber-700"}`}>{label}: {ready ? "ready" : "needs attention"}</span>)}</div></Section>}
      <button disabled={state.saving} className="bg-primary px-6 py-3 text-sm text-primary-foreground disabled:opacity-60">{state.saving ? "Saving…" : "Save booking & billing"}</button>
    </form>}
  </section></SiteChrome>;
}
function Section({ title, children }) { return <section className="border-t border-border pt-6"><h2 className="font-display text-2xl font-semibold">{title}</h2><div className="mt-5">{children}</div></section>; }
function Field({ label, value, onChange, type = "text" }) { return <label className="text-sm font-medium">{label}<input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={input} /></label>; }
function Area({ label, value, onChange }) { return <label className="text-sm font-medium">{label}<textarea value={value || ""} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-24 w-full border border-border bg-background p-3" /></label>; }
