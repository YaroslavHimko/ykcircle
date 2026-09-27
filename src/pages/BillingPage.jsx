import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Building2, Check, ChevronDown, CreditCard, FileText, Landmark, Plus, Receipt } from 'lucide-react';
import SiteChrome from '@/components/SiteChrome';
import BillingProfileEditor from '@/components/billing/BillingProfileEditor';
import OrganizationEditor from '@/components/billing/OrganizationEditor';
import PaymentAccounts from '@/components/billing/PaymentAccounts';
import { asList, billingRequest, ErrorNotice, primaryButton, secondaryButton } from '@/components/billing/shared';
import { safeBillingReturn } from '@/lib/billing';
import { PlatformBillingPage } from './FinancialPages';
import VenueBillingPage from './VenueBillingPage';

export function LegacyBillingRedirect({ section = 'profiles' }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  if (!params.has('section')) params.set('section', section);
  return <Navigate replace to={`/account/billing?${params}`} />;
}

function BillingSection({ id, title, description, icon: Icon, open, onToggle, children }) {
  return <section className="overflow-hidden rounded-lg border border-border bg-background"><h2><button type="button" aria-expanded={open} aria-controls={`billing-${id}`} onClick={onToggle} className="flex w-full items-center gap-4 p-5 text-left hover:bg-secondary/20 sm:p-6"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/30"><Icon className="h-5 w-5 text-primary" /></span><span className="flex-1"><span className="block font-medium">{title}</span><span className="mt-1 block text-sm font-normal text-muted-foreground">{description}</span></span><ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} /></button></h2>{open && <div id={`billing-${id}`} className="border-t border-border p-5 sm:p-6">{children}</div>}</section>;
}

export default function BillingPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [profiles, setProfiles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState(null);
  const [organizationEditor, setOrganizationEditor] = useState(null);
  const [expandedProfile, setExpandedProfile] = useState(null);
  const [archiving, setArchiving] = useState(null);
  const [revision, setRevision] = useState(0);
  const section = params.get('section') || 'profiles';
  const venueId = params.get('venueId');
  const requestedOrganizationId = params.get('organizationId');
  const newOrganization = params.get('new') === 'organization' && /^\d+$/.test(requestedOrganizationId || '');
  const returnTo = safeBillingReturn(params.get('returnTo'));

  const load = useCallback(async () => {
    if (!localStorage.getItem('authToken')) return;
    setLoading(true);
    const results = await Promise.allSettled([billingRequest('/api/me/billing-profiles'), billingRequest('/api/my/organizations'), billingRequest('/api/venues/mine')]);
    const nextErrors = {};
    [['profiles', setProfiles, 'profiles'], ['organizations', setOrganizations, 'organizations'], ['venues', setVenues, 'venues']].forEach(([key, setter, listKey], index) => {
      if (results[index].status === 'fulfilled') setter(asList(results[index].value, listKey));
      else nextErrors[key] = results[index].reason.message;
    });
    setErrors(nextErrors); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (newOrganization) setEditor({ profileType: 'organization', ownerOrganizationId: requestedOrganizationId }); }, [newOrganization, requestedOrganizationId]);
  const changeSection = (next, extra = {}) => {
    setParams((current) => { const query = new URLSearchParams(current); query.set('section', next); Object.entries(extra).forEach(([key, value]) => value ? query.set(key, value) : query.delete(key)); return query; });
  };
  const closeEditor = () => {
    setEditor(null);
    if (params.has('new')) setParams((current) => { const query = new URLSearchParams(current); query.delete('new'); query.delete('organizationId'); return query; }, { replace: true });
  };
  const organizationSaved = (saved) => {
    setOrganizations((current) => [...current.filter((item) => item.id !== saved.id), saved]);
    setOrganizationEditor(null);
  };
  const profileSaved = (saved) => {
    const wasNew = !editor.id;
    setProfiles((current) => [...current.filter((item) => item.id !== saved.id).map((item) => saved.isDefault && Number(item.ownerOrganizationId || 0) === Number(saved.ownerOrganizationId || 0) ? { ...item, isDefault: false } : item), saved]);
    setExpandedProfile(saved.id); closeEditor(); setRevision((value) => value + 1);
    if (section === 'organizations') changeSection('profiles');
    setNotice(wasNew ? 'Billing profile saved. You can now use it for purchases, or connect Stripe to collect ticket payments.' : 'Billing details updated.');
    if (wasNew && returnTo) navigate(returnTo);
  };
  const archive = async (profile) => {
    if (!window.confirm(`Archive ${profile.legalName}? Historical invoices and ticket orders remain available.`)) return;
    setArchiving(profile.id); setNotice('');
    try {
      await billingRequest(`/api/me/billing-profiles/${profile.id}`, { method: 'DELETE' });
      setProfiles((current) => current.filter((item) => item.id !== profile.id));
      setRevision((value) => value + 1); setNotice('Billing profile archived. Historical invoices and ticket orders remain available.');
    } catch (error) { setErrors((current) => ({ ...current, profiles: error.message })); } finally { setArchiving(null); }
  };
  if (!localStorage.getItem('authToken')) return <Navigate replace to={`/login?from=${encodeURIComponent(`/account/billing?${params}`)}`} />;

  return <SiteChrome><Helmet><title>Billing & organizations | YKCircle</title><meta name="robots" content="noindex" /></Helmet><section className="mx-auto max-w-5xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
    <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">Your account</p>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-5"><div><h1 className="font-display text-4xl font-bold sm:text-5xl">Billing & organizations</h1><p className="mt-3 max-w-xl text-muted-foreground">Your details, payments, and invoices. All in one place.</p></div><Link to="/account/invoices" className={secondaryButton}><Receipt className="h-4 w-4" />View invoices</Link></div>
    {notice && <p role="status" className="mt-6 rounded-md border border-primary/25 bg-primary/5 p-4 text-sm">{notice}</p>}
    {loading ? <p role="status" className="mt-10 text-muted-foreground">Loading your billing details…</p> : <>
      {!profiles.length && !errors.profiles && <section className="mt-8 rounded-lg border border-primary/20 bg-primary/5 p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Get started</p><h2 className="mt-2 font-display text-3xl font-semibold">Set up billing, one step at a time.</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">Add your personal or organization details once, then use them for purchases, venue invoices, and paid tickets. Free events don’t need billing setup.</p><ol className="my-6 grid gap-4 text-sm sm:grid-cols-3">{['Choose your identity', 'Add invoice details', 'Review and start using'].map((label, index) => <li key={label} className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 text-xs text-primary">{index + 1}</span>{label}</li>)}</ol><button onClick={() => setEditor({})} className={primaryButton}>Set up billing<ArrowRight className="h-4 w-4" /></button></section>}
      <div className="mt-8 space-y-4">
        <BillingSection id="profiles" icon={CreditCard} title="Billing details & payments" description={`${profiles.length} billing ${profiles.length === 1 ? 'profile' : 'profiles'} · Personal and organization details, connected Stripe accounts`} open={section === 'profiles'} onToggle={() => changeSection(section === 'profiles' ? 'overview' : 'profiles')}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="max-w-lg text-sm text-muted-foreground">Choose who pays or receives payments. Each profile holds the legal details used on invoices.</p><button onClick={() => setEditor({})} className={secondaryButton}><Plus className="h-4 w-4" />Add billing profile</button></div><ErrorNotice error={errors.profiles} />
          <div className="divide-y divide-border">{profiles.map((profile) => <article key={profile.id} className="py-4"><div className="flex flex-wrap items-center justify-between gap-3"><button type="button" aria-expanded={expandedProfile === profile.id} onClick={() => setExpandedProfile(expandedProfile === profile.id ? null : profile.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary"><FileText className="h-4 w-4" /></span><span className="min-w-0"><span className="flex flex-wrap items-center gap-2 font-medium">{profile.legalName}{profile.isDefault && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Default</span>}</span><span className="mt-1 block break-words text-xs text-muted-foreground">{profile.profileType === 'organization' ? 'Organization' : 'Individual'} · {profile.billingEmail}</span></span><ChevronDown className={`ml-auto h-4 w-4 shrink-0 ${expandedProfile === profile.id ? 'rotate-180' : ''}`} /></button><button type="button" onClick={() => setEditor(profile)} className={secondaryButton}>Edit<span className="sr-only"> {profile.legalName}</span></button></div>{expandedProfile === profile.id && <div className="mt-5 space-y-5 rounded-md border border-border p-4 sm:p-5"><div className="flex flex-wrap justify-between gap-4"><div><p className="flex items-center gap-2 text-sm font-medium"><Check className="h-4 w-4 text-primary" />Billing profile saved</p><p className="mt-2 text-sm text-muted-foreground">{[profile.addressLine1, profile.postalCode, profile.city, profile.country].filter(Boolean).join(', ')}</p></div><button type="button" disabled={archiving !== null} onClick={() => archive(profile)} className="text-sm text-destructive underline disabled:opacity-50">{archiving === profile.id ? 'Archiving…' : 'Archive profile'}</button></div><div className="border-t border-border pt-5"><PaymentAccounts profile={profile} /></div></div>}</article>)}</div>
        </BillingSection>
        <BillingSection id="organizations" icon={Building2} title="Organizations" description={`${organizations.length} ${organizations.length === 1 ? 'organization' : 'organizations'} · Business information and contact details`} open={section === 'organizations'} onToggle={() => changeSection(section === 'organizations' ? 'overview' : 'organizations')}>
          <ErrorNotice error={errors.organizations} /><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Manage the organizations behind your venues and billing profiles.</p><button type="button" onClick={() => setOrganizationEditor({})} className={secondaryButton}><Plus className="h-4 w-4" />Add organization</button></div><div className="divide-y divide-border">{organizations.map((organization) => <article key={organization.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><h3 className="font-medium">{organization.name}</h3><p className="mt-1 text-sm text-muted-foreground">{organization.contactEmail || 'No contact email added'}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setEditor({ profileType: 'organization', ownerOrganizationId: organization.id, legalName: organization.name, billingEmail: organization.contactEmail || '' })} className={secondaryButton}>Add billing profile</button><button onClick={() => setOrganizationEditor(organization)} className={secondaryButton}>Edit<span className="sr-only"> {organization.name}</span></button></div></article>)}</div>{!organizations.length && !errors.organizations && <p className="py-4 text-sm text-muted-foreground">Add an organization here, or create one during billing setup.</p>}
        </BillingSection>
        <BillingSection id="platform" icon={Receipt} title="Plans & purchases" description="YKCircle services, platform payments, and subscriptions" open={section === 'platform'} onToggle={() => changeSection(section === 'platform' ? 'overview' : 'platform')}><PlatformBillingPage embedded key={revision} onAddProfile={() => setEditor({})} /></BillingSection>
        <BillingSection id="venues" icon={Landmark} title="Venue billing" description="Seller details, invoice settings, and payment instructions for each venue" open={section === 'venues'} onToggle={() => changeSection(section === 'venues' ? 'overview' : 'venues')}>
          <ErrorNotice error={errors.venues} />{venues.length > 0 && <label className="mb-6 block text-sm font-medium">Venue<select value={venueId || ''} onChange={(event) => changeSection('venues', { venueId: event.target.value })} className="mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3"><option value="">Choose a venue</option>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}</select></label>}{venueId ? <VenueBillingPage key={venueId} venueId={venueId} profileRevision={revision} embedded onAddProfile={(organizationId) => { if (organizationId) setEditor({ profileType: 'organization', ownerOrganizationId: organizationId }); else setEditor({}); }} /> : <p className="text-sm text-muted-foreground">{venues.length ? 'Choose a venue to manage its billing settings here.' : 'Your venues will appear here once you have a listing.'} <Link to="/profile/venues" className="text-primary underline">Manage venues</Link></p>}<Link to="/profile/invoices" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm text-primary underline">View venue invoices<ArrowRight className="h-4 w-4" /></Link>
        </BillingSection>
      </div>{Object.keys(errors).length > 0 && <div className="mt-5 space-y-3"><ErrorNotice error="Some billing information could not be loaded. Open the relevant section for details, or try again." /><button type="button" onClick={load} className={secondaryButton}>Reload billing information</button></div>}
    </>}
    {editor && <BillingProfileEditor profile={editor} organizations={organizations} onOrganizationSaved={organizationSaved} onSaved={profileSaved} onClose={closeEditor} />}
    {organizationEditor && <OrganizationEditor organization={organizationEditor} onSaved={(saved) => { organizationSaved(saved); setNotice('Organization details saved.'); }} onClose={() => setOrganizationEditor(null)} />}
  </section></SiteChrome>;
}
