import { Route } from 'react-router-dom';
import ContactPage from '@/features/support/pages/ContactPage.jsx';
import ReportPage from '@/features/support/pages/ReportPage.jsx';
import AppealPage from '@/features/support/pages/AppealPage.jsx';
export const supportRoutes = [
  <Route key="/contact" path="/contact" element={<ContactPage />} />,
  <Route key="/report" path="/report" element={<ReportPage />} />,
  <Route key="/appeal" path="/appeal" element={<AppealPage />} />,
];
