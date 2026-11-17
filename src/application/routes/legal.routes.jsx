import { Route } from 'react-router-dom';
import LegalDocumentsPage from '@/features/legal/pages/LegalDocumentsPage.jsx';
import {
  CompanyInformationPage,
  SubprocessorsPage,
} from '@/features/legal/pages/CompanyInformationPage.jsx';
export const legalRoutes = [
  <Route key="/legal" path="/legal" element={<LegalDocumentsPage />} />,
  <Route key="/legal/:slug" path="/legal/:slug" element={<LegalDocumentsPage />} />,
  <Route key="/terms" path="/terms" element={<LegalDocumentsPage documentSlug="terms" />} />,
  <Route key="/privacy" path="/privacy" element={<LegalDocumentsPage documentSlug="privacy" />} />,
  <Route key="/cookies" path="/cookies" element={<LegalDocumentsPage documentSlug="cookies" />} />,
  <Route
    key="/community-guidelines"
    path="/community-guidelines"
    element={<LegalDocumentsPage documentSlug="community-guidelines" />}
  />,
  <Route
    key="/organizer-terms"
    path="/organizer-terms"
    element={<LegalDocumentsPage documentSlug="organizer-terms" />}
  />,
  <Route
    key="/venue-terms"
    path="/venue-terms"
    element={<LegalDocumentsPage documentSlug="venue-terms" />}
  />,
  <Route
    key="/tickets-refunds"
    path="/tickets-refunds"
    element={<LegalDocumentsPage documentSlug="tickets-refunds" />}
  />,
  <Route
    key="/paid-services"
    path="/paid-services"
    element={<LegalDocumentsPage documentSlug="paid-services" />}
  />,
  <Route
    key="/marketplace-transparency"
    path="/marketplace-transparency"
    element={<LegalDocumentsPage documentSlug="marketplace-transparency" />}
  />,
  <Route key="/operator" path="/operator" element={<CompanyInformationPage />} />,
  <Route key="/subprocessors" path="/subprocessors" element={<SubprocessorsPage />} />,
];
