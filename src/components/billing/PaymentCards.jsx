import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, CircleAlert, CircleDashed } from 'lucide-react';
import { usageLabel } from '@/lib/payments';
import { secondaryButton } from './shared';

export function PaymentStatus({ state, children }) {
  const ready = ['ready', 'active'].includes(state);
  const attention = ['incomplete', 'action_required', 'business_required'].includes(state);
  const Icon = ready ? CheckCircle2 : attention ? CircleAlert : CircleDashed;
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${ready ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground'}`}><Icon aria-hidden="true" className="h-4 w-4 shrink-0" />{children}</span>;
}

export function PaymentCard({ icon: Icon, title, description, children, to, action }) {
  return <article className="flex h-full flex-col rounded-xl border border-border bg-background p-6 sm:p-7"><span className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-secondary"><Icon aria-hidden="true" className="h-5 w-5 text-primary" /></span><h3 className="font-display text-2xl font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p><div className="my-5 space-y-2">{children}</div><Link to={to} className="mt-auto inline-flex min-h-11 items-center gap-2 self-start rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">{action}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></article>;
}

export function BusinessIdentityCard({ profile, onEdit, onArchive, archiving, ticket }) {
  return <article className="rounded-xl border border-border p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{profile.profileType === 'individual' ? 'Personal' : 'Organization'}</p><h2 className="mt-2 font-display text-2xl font-semibold">{profile.legalName}</h2>{profile.organizationNumber && profile.profileType === 'organization' && <p className="mt-1 text-sm text-muted-foreground">{profile.organizationNumber}</p>}</div><button type="button" onClick={() => onEdit(profile)} className={secondaryButton}>Edit<span className="sr-only"> {profile.legalName}</span></button></div>
    <div className="mt-5"><h3 className="text-sm font-semibold">Used for</h3>{profile.usedFor?.length ? <ul className="mt-2 space-y-2 text-sm text-muted-foreground">{profile.usedFor.map((usage, index) => <li key={`${usage.purpose}-${index}`} className="flex gap-2"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{usageLabel(usage)}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Nothing yet</p>}</div>
    <details className="mt-5 border-t border-border pt-4"><summary className="min-h-11 cursor-pointer text-sm font-medium">View business details</summary><dl className="grid gap-4 text-sm sm:grid-cols-2">{[['Legal name', profile.legalName], ['VAT number', profile.profileType === 'organization' && profile.vatNumber], ['Address', [profile.addressLine1, profile.addressLine2, profile.postalCode, profile.city, profile.country].filter(Boolean).join(', ')], ['Billing email', profile.billingEmail]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>)}</dl>{ticket?.accounts.length > 0 && <Link className="mt-4 block min-h-11 text-sm text-primary underline" to={`/account/payments/tickets?sellerId=${profile.id}`}>Manage ticket payments</Link>}{profile.ownerOrganizationId && <Link className="mt-4 block min-h-11 text-sm text-primary underline" to={`/account/organizations?organizationId=${profile.ownerOrganizationId}`}>Manage organization</Link>}<button type="button" disabled={archiving} onClick={() => onArchive(profile)} className="mt-4 min-h-11 text-sm text-destructive underline disabled:opacity-50">Archive details</button></details>
  </article>;
}
