import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import SiteChrome from "@/components/SiteChrome";
import { apiFetch } from "@/lib/api";

const label = (value) => value || "Not currently published";

export function CompanyInformationPage() {
  const [company, setCompany] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { apiFetch("/api/company").then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load company information."); return data; }).then(setCompany).catch((requestError) => setError(requestError.message)); }, []);
  const fields = [["Legal operator", company?.legalOperatorName], ["Organisation number", company?.organizationNumber], ["VAT number", company?.vatNumber], ["Registered address", company?.registeredAddress], ["Support email", company?.supportEmail], ["Privacy contact", company?.privacyEmail], ["Moderation contact", company?.moderationEmail], ["Country of establishment", company?.country]];
  return <SiteChrome><Helmet><title>Company information | YKCircle</title></Helmet><section className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><p className="text-xs uppercase tracking-[0.3em] text-primary">Company</p><h1 className="mt-3 font-display text-5xl font-black">Company information</h1>{error ? <p role="alert" className="mt-6 text-destructive">{error}</p> : !company ? <p className="mt-6 text-muted-foreground">Loading company information…</p> : <dl className="mt-10 divide-y border-y border-border">{fields.map(([name, value]) => <div key={name} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]"><dt className="font-medium">{name}</dt><dd className="text-muted-foreground">{label(value)}</dd></div>)}</dl>}</section></SiteChrome>;
}

export function SubprocessorsPage() {
  const [providers, setProviders] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { apiFetch("/api/subprocessors").then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load provider information."); return data.subprocessors || []; }).then(setProviders).catch((requestError) => setError(requestError.message)); }, []);
  return <SiteChrome><Helmet><title>Subprocessors | YKCircle</title></Helmet><section className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><p className="text-xs uppercase tracking-[0.3em] text-primary">Privacy</p><h1 className="mt-3 font-display text-5xl font-black">Service providers and subprocessors</h1><p className="mt-5 text-muted-foreground">This list is maintained from the deployment’s verified provider inventory.</p>{error ? <p role="alert" className="mt-6 text-destructive">{error}</p> : providers === null ? <p className="mt-6 text-muted-foreground">Loading provider information…</p> : providers.length ? <ul className="mt-8 divide-y border-y border-border">{providers.map((provider, index) => <li key={provider.id || provider.name || index} className="py-4">{typeof provider === "string" ? provider : <><p className="font-medium">{provider.name || "Unnamed provider"}</p>{provider.purpose && <p className="mt-1 text-sm text-muted-foreground">{provider.purpose}</p>}</>}</li>)}</ul> : <p className="mt-8 border border-amber-500/50 bg-amber-500/10 p-4 text-sm">The provider inventory has not been published yet. This is a commercial-launch blocker.</p>}</section></SiteChrome>;
}
