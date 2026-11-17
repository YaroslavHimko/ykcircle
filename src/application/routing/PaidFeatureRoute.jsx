import { useProductConfiguration } from '@/shared/hooks/useProductConfiguration.js';
import SiteChrome from '@/shared/components/SiteChrome.jsx';
import PageHeader from '@/shared/components/PageHeader.jsx';
export default function PaidFeatureRoute({ children, feature }) {
  const product = useProductConfiguration();
  const enabled = feature
    ? product[feature]
    : product.subscriptionsEnabled ||
      product.paidEventsEnabled ||
      product.paidVenuesEnabled ||
      product.paidServicesEnabled;
  if (product.loading)
    return (
      <SiteChrome>
        <section className="page-container">
          <PageHeader title="Loading..." />
          <p role="status" className="mt-6">
            Loading account features...
          </p>
        </section>
      </SiteChrome>
    );
  if (!enabled)
    return (
      <SiteChrome>
        <section className="page-container">
          <PageHeader
            title="Free early access"
            description="This feature is not available during free early access."
          />
        </section>
      </SiteChrome>
    );
  return children;
}
