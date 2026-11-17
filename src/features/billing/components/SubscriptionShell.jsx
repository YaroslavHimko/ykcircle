import PageHeader from '@/shared/components/PageHeader.jsx';
import SiteChrome from '@/shared/components/SiteChrome.jsx';

export function SubscriptionShell({
  title,
  children,
  embedded = false,
  eyebrow = 'Your account',
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
