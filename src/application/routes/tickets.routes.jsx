import { Route } from 'react-router-dom';
import PaidFeatureRoute from '../routing/PaidFeatureRoute.jsx';
import { TicketsPage } from '@/features/tickets/pages/TicketsPage.jsx';
import { TicketOrderPage } from '@/features/tickets/pages/TicketOrderPage.jsx';
import { TicketCheckoutPage } from '@/features/tickets/pages/TicketCheckoutPage.jsx';
export const ticketsRoutes = [
  <Route
    key="/account/tickets"
    path="/account/tickets"
    element={
      <PaidFeatureRoute feature="paidEventsEnabled">
        <TicketsPage />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/tickets/success"
    path="/tickets/success"
    element={
      <PaidFeatureRoute feature="paidEventsEnabled">
        <TicketsPage success />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/tickets/:id"
    path="/tickets/:id"
    element={
      <PaidFeatureRoute feature="paidEventsEnabled">
        <TicketOrderPage />
      </PaidFeatureRoute>
    }
  />,
  <Route
    key="/events/:id/tickets"
    path="/events/:id/tickets"
    element={
      <PaidFeatureRoute feature="paidEventsEnabled">
        <TicketCheckoutPage />
      </PaidFeatureRoute>
    }
  />,
];
