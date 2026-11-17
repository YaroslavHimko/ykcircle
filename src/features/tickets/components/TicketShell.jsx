import PageHeader from '@/shared/components/PageHeader.jsx';
import SiteChrome from '@/shared/components/SiteChrome.jsx';
export function Shell({ title, children, description }) {
  return (
    <SiteChrome>
      <section className="page-container">
        <PageHeader eyebrow="Event tickets" title={title} description={description} />
        {children}
      </section>
    </SiteChrome>
  );
}
export function ErrorNotice({ message }) {
  return message ? (
    <p
      role="alert"
      className="rounded-2xl mt-5 border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
    >
      {message}
    </p>
  ) : null;
}
export function TestNotice({ checkout = false }) {
  return (
    <aside className="rounded-2xl mt-5 border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <strong>Stripe test mode — no real money is charged.</strong>
      {checkout && (
        <p className="mt-2">
          At Stripe checkout, use card <code>4242 4242 4242 4242</code>, any future expiry date, and
          any three-digit CVC. Your ticket email will still be sent to your account email.
        </p>
      )}
    </aside>
  );
}
