import { Route } from 'react-router-dom';
import ConfigurationPage from '@/features/admin/pages/ConfigurationPage.jsx';
import AdminContactMessagesPage from '@/features/admin/pages/AdminContactMessagesPage.jsx';
import UserRolesPage from '@/features/admin/pages/UserRolesPage.jsx';
import AdminReportsPage from '@/features/admin/pages/AdminReportsPage.jsx';
export const adminRoutes = [
  <Route key="/admin/configuration" path="/admin/configuration" element={<ConfigurationPage />} />,
  <Route
    key="/admin/contact-messages"
    path="/admin/contact-messages"
    element={<AdminContactMessagesPage />}
  />,
  <Route key="/admin/users" path="/admin/users" element={<UserRolesPage />} />,
  <Route key="/admin/reports" path="/admin/reports" element={<AdminReportsPage />} />,
];
