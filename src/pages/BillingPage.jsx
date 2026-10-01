import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { BriefcaseBusiness, Building2, CreditCard, FileText, Ticket } from 'lucide-react';
import SiteChrome from '@/components/SiteChrome';
import BillingProfileEditor from '@/components/billing/BillingProfileEditor';
import BusinessIdentitySelector from '@/components/billing/BusinessIdentitySelector';
import PaymentAccounts from '@/components/billing/PaymentAccounts';
import { BusinessIdentityCard, PaymentCard, PaymentStatus } from '@/components/billing/PaymentCards';
import { billingRequest, ErrorNotice, secondaryButton } from '@/components/billing/shared';
import { safeBillingReturn } from '@/lib/billing';
import { formatDate, formatMoney, legacyPaymentsPath, methodLabels, missingLabels, paymentTitles, subscriptionStatus, ticketStatus } from '@/lib/payments';
import SubscriptionsPage from './SubscriptionsPage';
import { PlatformBillingPage } from './FinancialPages';
import { DocumentsPanel } from './InvoicesPage';
import VenueBillingPage from './VenueBillingPage';

export function LegacyBillingRedirect({ section = 'overview' }) {
  const location = useLocation();
  return <Navigate replace to={legacyPaymentsPath(location.search, section)} />;
}
function DashboardGroup({ title, children, split = false }) {
  return <section className="space-y-4"><h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</h2><div className={`grid gap-4 ${split ? 'md:grid-cols-2' : ''}`}>{children}</div></section>;
}
function Overview({ data }) {
  const { plan, ticketSellers, venuePayments, businesses } = data;
  const current = plan.subscriptions.find((entry) => entry.feature === 'organizer.publish_event' && ['active', 'trialing', 'past_due', 'unpaid'].includes(entry.status));
  const connected = ticketSellers.filter((seller) => seller.accounts.length);
  const ticket = connected.find((seller) => seller.status !== 'ready') || connected[0];
  const readyVenues = venuePayments.filter((venue) => venue.status === 'ready');
  return <div className="space-y-9">
    <DashboardGroup title="Your YKCircle account"><PaymentCard icon={CreditCard} title="Your plan" description="Manage your YKCircle plan and premium features." to="/account/payments/plan" action="Manage plan"><p className="text-lg font-medium">{current?.planName || (plan.earlyAccess ? 'Early Access' : 'No active plan')}</p>{current?.amount != null && <p className="text-sm">{formatMoney(current.amount, current.currency)} / {current.billingInterval}</p>}{current?.currentPeriodEnd && !current.cancelAtPeriodEnd && <p className="text-sm text-muted-foreground">Renews {formatDate(current.currentPeriodEnd)}</p>}<PaymentStatus state={current?.status || (plan.earlyAccess ? 'active' : 'unused')}>{current ? subscriptionStatus(current) : plan.earlyAccess ? 'Free during launch' : 'No active plan'}</PaymentStatus><p className="text-sm text-muted-foreground">{plan.earlyAccess ? 'Organizer tools and Event publishing are currently included.' : 'Payments you make to YKCircle for premium features.'}</p></PaymentCard></DashboardGroup>
    <DashboardGroup title="Get paid" split><PaymentCard icon={Ticket} title="Ticket payments" description="Receive payments when people buy tickets to your Events." to="/account/payments/tickets" action={connected.length ? 'Manage ticket payments' : 'Set up ticket payments'}><PaymentStatus state={ticket?.status}>{ticket ? ticketStatus[ticket.status] : 'Not set up'}</PaymentStatus><p className="text-sm text-muted-foreground">{ticket?.sellerName || 'Set up payments when you start selling paid tickets.'}</p>{connected.length > 1 && <p className="text-sm text-muted-foreground">{connected.length} sellers</p>}</PaymentCard><PaymentCard icon={Building2} title="Venue payments" description="Configure how customers pay you when they book your Venues." to="/account/payments/venues" action="Manage Venue payments"><PaymentStatus state={readyVenues.length ? 'ready' : 'unused'}>{readyVenues.length ? `${readyVenues.length} ${readyVenues.length === 1 ? 'Venue' : 'Venues'} configured` : 'No paid Venue setup yet'}</PaymentStatus>{venuePayments.some((venue) => venue.status === 'incomplete') && <p className="text-sm">Some Venues need setup</p>}{readyVenues.slice(0, 2).map((venue) => <p key={venue.id} className="text-sm text-muted-foreground">{venue.name} · {venue.methods.map((method) => methodLabels[method] || 'Other').join(', ') || 'Your accounting system'}</p>)}</PaymentCard></DashboardGroup>
    <DashboardGroup title="Business"><PaymentCard icon={BriefcaseBusiness} title="Business details" description="Personal and company information used for payments, invoices and selling." to="/account/payments/business" action="Manage business details"><p className="text-sm">{businesses.filter((profile) => profile.profileType === 'organization').length} {businesses.filter((profile) => profile.profileType === 'organization').length === 1 ? 'business' : 'businesses'}{businesses.some((profile) => profile.profileType === 'individual') ? ' + Personal' : ''}</p></PaymentCard></DashboardGroup>
    <DashboardGroup title="Documents"><PaymentCard icon={FileText} title="Invoices & receipts" description="View Venue invoices and purchases made through YKCircle." to="/account/payments/documents" action="View invoices & receipts"><p className="text-sm">{data.unpaidInvoices ? `${data.unpaidInvoices} ${data.unpaidInvoices === 1 ? 'invoice' : 'invoices'} awaiting payment` : data.documents.length ? 'Venue and YKCircle documents' : 'No invoices or receipts yet'}</p></PaymentCard></DashboardGroup>
  </div>;
}
export function VenuePaymentSummary({ venue, children }) {
  return <article className="rounded-xl border border-border p-5 sm:p-6"><h2 className="font-display text-2xl font-semibold">{venue.name}</h2><div className="mt-4"><PaymentStatus state={venue.status}>{venue.status === 'ready' ? 'Ready to accept paid bookings' : venue.status === 'free' ? 'Free Venue · No payment setup needed' : 'Setup incomplete'}</PaymentStatus></div><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">{[['Seller', venue.sellerName || 'Business details required'], ['Pricing', venue.status === 'free' ? 'Free' : `${formatMoney(venue.rate, venue.currency)}${venue.rate == null ? '' : ` / ${venue.unit.replaceAll('_', ' ')}`}`], ['Invoices', venue.invoiceMode === 'external' ? 'Your accounting system' : 'Created by YKCircle'], ['Customers pay via', venue.methods.map((method) => methodLabels[method] || 'Other').join(', ') || (venue.invoiceMode === 'external' ? 'Your invoice instructions' : 'Payment method required')], ['Payment terms', `${venue.paymentTermsDays} days`]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl>{venue.missing.length > 0 && <div className="mt-5 text-sm"><p className="font-medium">Missing</p><ul className="mt-2 list-inside list-disc text-muted-foreground">{venue.missing.map((item) => <li key={item}>{missingLabels[item] || 'Payment settings'}</li>)}</ul></div>}<div className="mt-5">{children}</div></article>;
}
export default function BillingPage() {
  const { area } = useParams();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const [data, setData] = useState(null), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [editor, setEditor] = useState(null), [archiving, setArchiving] = useState(false), [selectedSeller, setSelectedSeller] = useState('');
  const [revision, setRevision] = useState(0);
  const load = useCallback(async () => { setError(''); try { setData(await billingRequest('/api/account/payments-overview')); } catch (failure) { setError(failure.message); } }, []);
  useEffect(() => { if (localStorage.getItem('authToken')) load(); }, [load]);
  useEffect(() => {
    if (data && params.get('new') === 'organization') {
      const organization = data.organizations.find((item) => String(item.id) === params.get('organizationId'));
      if (organization) setEditor(data.businesses.find((item) => Number(item.ownerOrganizationId) === Number(organization.id)) || { profileType: 'organization', ownerOrganizationId: organization.id, legalName: organization.name, billingEmail: organization.contactEmail || '' });
    }
  }, [data, params]);
  const returnTo = safeBillingReturn(params.get('returnTo'));
  const venue = data?.venuePayments.find((item) => String(item.id) === params.get('venueId'));
  const sellerId = selectedSeller || params.get('sellerId') || data?.ticketSellers.find((item) => item.accounts.length)?.profileId || data?.businesses[0]?.id || '';
  const seller = data?.businesses.find((item) => String(item.id) === String(sellerId));
  const closeEditor = () => { setEditor(null); if (params.has('new')) setParams((current) => { const next = new URLSearchParams(current); next.delete('new'); return next; }, { replace: true }); };
  const saved = (profile) => { closeEditor(); setSelectedSeller(String(profile.id)); setRevision((value) => value + 1); setNotice('Business details saved.'); load(); };
  const archive = async (profile) => {
    if (!window.confirm(`Archive ${profile.legalName}? Historical invoices and orders remain available.`)) return;
    setArchiving(true);
    try { await billingRequest(`/api/me/billing-profiles/${profile.id}`, { method: 'DELETE' }); await load(); setNotice('Business details archived.'); } catch (failure) { setError(failure.message); } finally { setArchiving(false); }
  };
  if (!localStorage.getItem('authToken')) return <Navigate replace to={`/login?from=${encodeURIComponent(location.pathname + location.search)}`} />;
  if (area && !paymentTitles[area]) return <Navigate replace to="/account/payments" />;
  const title = paymentTitles[area] || 'Payments & business';
  return <SiteChrome><Helmet><title>{title} | YKCircle</title><meta name="robots" content="noindex" /></Helmet><main className="mx-auto max-w-5xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><Link to="/profile" className="inline-flex min-h-11 items-center hover:underline">Your account</Link>{area && <><span aria-hidden="true">/</span><Link to="/account/payments" className="inline-flex min-h-11 items-center hover:underline">Payments & business</Link></>}<span aria-hidden="true">/</span><span aria-current="page">{title}</span></nav>
    <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{title}</h1><p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{({ plan: 'Payments you make to YKCircle for premium features.', tickets: 'Ticket payments are used when attendees buy paid Event tickets. Money is processed for the Event seller.', venues: 'Payments you receive from organizers booking your Venue.', business: 'Legal and contact information used on payments and invoices.', documents: 'Financial documents from Venue bookings and YKCircle purchases.' })[area] || 'Manage what you pay for, how you receive money, and the business details used for transactions.'}</p>
    {returnTo && <Link to={returnTo} className="mt-4 inline-flex min-h-11 items-center text-sm text-primary underline">Return to where you started</Link>}{notice && <p role="status" className="mt-5 text-sm text-primary">{notice}</p>}{error && <div className="mt-6"><ErrorNotice error={error} /><button className={secondaryButton} onClick={load}>Try again</button></div>}{!data && !error && <p role="status" className="mt-8">Loading payments and business details…</p>}
    {data && <div className="mt-9">
      {!area && <Overview data={data} />}
      {area === 'plan' && <><SubscriptionsPage embedded /><details className="mt-8 rounded-lg border border-border p-5"><summary className="min-h-11 cursor-pointer font-medium">Other YKCircle purchases</summary><PlatformBillingPage embedded /></details></>}
      {area === 'tickets' && <div className="space-y-6">{!data.ticketSellers.some((item) => item.accounts.length) && <div className="rounded-xl bg-secondary/40 p-6"><h2 className="font-display text-2xl font-semibold">Not selling tickets yet?</h2><p className="mt-2 text-sm text-muted-foreground">You only need to set up ticket payments when you want to sell paid Event tickets.</p></div>}<BusinessIdentitySelector context="ticket_seller" profiles={data.businesses} value={sellerId} onChange={setSelectedSeller} onCreated={saved} />{seller && <section className="rounded-xl border border-border p-6"><h2 className="font-display text-2xl font-semibold">{seller.legalName}</h2><PaymentAccounts key={`${seller.id}-${revision}`} profile={seller} returnTo={returnTo || '/account/payments'} onUpdated={load} /></section>}</div>}
      {area === 'business' && <><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><p className="text-sm text-muted-foreground">Reuse your existing details across payments and purchases.</p><button type="button" onClick={() => setEditor({})} className={secondaryButton}>Add business</button></div>{!data.businesses.some((item) => item.profileType === 'organization') && <p className="mb-5 text-sm text-muted-foreground">No business added yet. Add business details when you organize Events, sell tickets or operate a Venue as a company.</p>}<div className="space-y-4">{data.businesses.map((profile) => <BusinessIdentityCard key={profile.id} profile={profile} ticket={data.ticketSellers.find((item) => item.profileId === profile.id)} onEdit={setEditor} onArchive={archive} archiving={archiving} />)}</div></>}
      {area === 'venues' && <div className="space-y-5">{!data.venuePayments.length && <div className="rounded-xl border border-border p-6"><h2 className="font-display text-2xl font-semibold">No paid Venue setup yet.</h2><p className="my-4 text-sm text-muted-foreground">When you list a paid Venue, you’ll configure how customers pay you for bookings.</p><Link to="/profile/venues" className={secondaryButton}>Manage Venues</Link></div>}{(venue ? [venue] : data.venuePayments).map((item) => <VenuePaymentSummary key={item.id} venue={item}><Link className={secondaryButton} to={`/account/payments/venues?${new URLSearchParams({ venueId: item.id, edit: '1', ...(returnTo ? { returnTo } : {}) })}`}>{item.status === 'incomplete' ? 'Complete setup' : 'Edit Venue payment settings'}</Link><Link to={`/profile/venues/${item.id}/calendar`} className="ml-4 inline-flex min-h-11 items-center text-sm text-primary underline">Edit pricing</Link></VenuePaymentSummary>)}{venue && params.get('edit') === '1' && <VenueBillingPage embedded key={venue.id} venueId={venue.id} profileRevision={revision} onSaved={load} />}{venue && <Link to="/account/payments/venues" className="inline-flex min-h-11 items-center text-sm text-primary underline">All Venue payments</Link>}</div>}
      {area === 'documents' && <DocumentsPanel documents={data.documents} venueId={params.get('venueId')} />}
    </div>}
    {editor && <BillingProfileEditor profile={editor} organizations={data?.organizations || []} existingProfiles={data?.businesses || []} onOrganizationSaved={(organization) => setData((current) => ({ ...current, organizations: [...current.organizations, organization] }))} onSaved={saved} onClose={closeEditor} />}
  </main></SiteChrome>;
}
