import { Routes } from 'react-router-dom';
import { marketingRoutes } from '../routes/marketing.routes.jsx';
import { supportRoutes } from '../routes/support.routes.jsx';
import { legalRoutes } from '../routes/legal.routes.jsx';
import { authRoutes } from '../routes/auth.routes.jsx';
import { accountRoutes } from '../routes/account.routes.jsx';
import { billingRoutes } from '../routes/billing.routes.jsx';
import { adminRoutes } from '../routes/admin.routes.jsx';
import { ticketsRoutes } from '../routes/tickets.routes.jsx';
import { venuesRoutes } from '../routes/venues.routes.jsx';
import { eventsRoutes } from '../routes/events.routes.jsx';
import { groupsRoutes } from '../routes/groups.routes.jsx';
import { articlesRoutes } from '../routes/articles.routes.jsx';
export const applicationRoutes = [
  ...marketingRoutes,
  ...supportRoutes,
  ...legalRoutes,
  ...authRoutes,
  ...accountRoutes,
  ...billingRoutes,
  ...adminRoutes,
  ...ticketsRoutes,
  ...venuesRoutes,
  ...eventsRoutes,
  ...groupsRoutes,
  ...articlesRoutes,
];
export default function AppRoutes() {
  return <Routes>{applicationRoutes}</Routes>;
}
