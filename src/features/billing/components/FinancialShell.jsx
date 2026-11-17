import PageHeader from '@/shared/components/PageHeader.jsx';
import SiteChrome from '@/shared/components/SiteChrome.jsx';
export function Shell({
  title,
  eyebrow = 'Your account',
  children,
  embedded = false,
  description,
}) {
  if (embedded)
    return (
      <div>
        {description && <p className="mt-4 max-w-2xl text-muted-foreground">{description}</p>}
        {children}
      </div>
    );
  return (
    <SiteChrome>
      <section className="page-container">
        <PageHeader eyebrow={eyebrow} title={title} description={description} />
        {children}
      </section>
    </SiteChrome>
  );
}
export function Notice({ error }) {
  return error ? (
    <p
      role="alert"
      className="rounded-2xl mt-6 border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
    >
      {error}
    </p>
  ) : null;
}
