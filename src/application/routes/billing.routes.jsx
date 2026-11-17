import { Route } from 'react-router-dom';
import PaidFeatureRoute from '../routing/PaidFeatureRoute.jsx';
import SubscriptionsPage from '@/features/billing/pages/SubscriptionsPage.jsx';
import { PlatformAdminPage } from '@/features/billing/pages/PlatformAdminPage.jsx';
import BillingPage, { LegacyBillingRedirect } from '@/features/billing/pages/BillingPage.jsx';
import OrganizationsPage from '@/features/billing/pages/OrganizationsPage.jsx';
import { PaymentAccountReturnPage } from '@/features/billing/pages/PaymentAccountReturnPage.jsx';
import VenueBillingPage from '@/features/billing/pages/VenueBillingPage.jsx';
import { InvoiceDetailPage } from '@/features/billing/pages/InvoicesPage.jsx';
export const billingRoutes = [
  <Route
    key="/profile/subscriptions"
    path="/profile/subscriptions"
    element={
      <PaidFeatureRoute feature="subscriptionsEnabled">
        <SubscriptionsPage />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/subscribe"
    path="/subscribe"
    element={
      <PaidFeatureRoute feature="subscriptionsEnabled">
        <SubscriptionsPage />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/admin/platform-billing"
    path="/admin/platform-billing"
    element={
      <PaidFeatureRoute>
        <PlatformAdminPage />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/account/payments"
    path="/account/payments"
    element={
      <PaidFeatureRoute>
        <BillingPage />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/account/payments/:area"
    path="/account/payments/:area"
    element={
      <PaidFeatureRoute>
        <BillingPage />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/account/organizations"
    path="/account/organizations"
    element={
      <PaidFeatureRoute>
        <OrganizationsPage />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/account/billing"
    path="/account/billing"
    element={
      <PaidFeatureRoute>
        <LegacyBillingRedirect />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/account/plans"
    path="/account/plans"
    element={
      <PaidFeatureRoute>
        <LegacyBillingRedirect section="platform" />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/account/venue-billing"
    path="/account/venue-billing"
    element={
      <PaidFeatureRoute>
        <LegacyBillingRedirect section="venues" />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/account/billing-profiles"
    path="/account/billing-profiles"
    element={
      <PaidFeatureRoute>
        <LegacyBillingRedirect section="profiles" />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/billing/payment-account/refresh"
    path="/billing/payment-account/refresh"
    element={
      <PaidFeatureRoute>
        <PaymentAccountReturnPage refresh />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/billing/payment-account/complete"
    path="/billing/payment-account/complete"
    element={
      <PaidFeatureRoute>
        <PaymentAccountReturnPage />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/account/platform-billing"
    path="/account/platform-billing"
    element={
      <PaidFeatureRoute>
        <LegacyBillingRedirect section="platform" />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/profile/venues/:id/billing"
    path="/profile/venues/:id/billing"
    element={
      <PaidFeatureRoute>
        <VenueBillingPage />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/profile/invoices"
    path="/profile/invoices"
    element={
      <PaidFeatureRoute>
        <LegacyBillingRedirect section="invoices" />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/account/invoices"
    path="/account/invoices"
    element={
      <PaidFeatureRoute>
        <LegacyBillingRedirect section="invoices" />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/invoices/:invoiceId"
    path="/invoices/:invoiceId"
    element={
      <PaidFeatureRoute>
        <InvoiceDetailPage />
      </PaidFeatureRoute>
    }
  />,
];
