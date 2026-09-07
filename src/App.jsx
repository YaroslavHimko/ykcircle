import React from 'react';
import { Route, Routes, BrowserRouter as Router, useNavigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import JoinPage from './pages/JoinPage';
import ContactPage from './pages/ContactPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import AdminApplicationsPage from './pages/AdminApplicationsPage';
import CheckEmailPage from './pages/CheckEmailPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminApplicationPage from './pages/AdminApplicationPage';
import AccountDeletedPage from './pages/AccountDeletedPage';
import ApplicationSentPage from './pages/ApplicationSentPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import InvitationResponsePage from './pages/InvitationResponsePage';
import GroupInvitationPage from './pages/GroupInvitationPage';
import UserRolesPage from './pages/UserRolesPage';
import GroupsPage from './pages/GroupsPage';
import GroupSlugRedirect from './pages/GroupSlugRedirect';
import ArticlesPage from './pages/ArticlesPage';
import ReportPage from './pages/ReportPage';
import LegalDocumentsPage from './pages/LegalDocumentsPage';
import { CompanyInformationPage, SubprocessorsPage } from './pages/CompanyInformationPage';
import AppealPage from './pages/AppealPage';
import AdminReportsPage from './pages/AdminReportsPage';
import { AdminVenueApplicationsPage, MyVenuesPage, VenueBookingsPage, VenueOwnerApplicationPage } from './pages/VenuesPage';
import { SavedVenuesPage, VenueCityOrDetailPage, VenueDetailPage, VenueEditorPage, VenuesDiscoveryPage, VenueSearchRoutePage } from './pages/VenueMarketplace';
import { OrganizerAvailabilityPage, VenueCalendarPage } from './pages/VenueScheduling';
import { InvoiceDetailPage, InvoicesPage } from './pages/InvoicesPage';
import BillingProfilesPage from './pages/BillingProfilesPage';
import { PaymentAccountReturnPage, PlatformAdminPage, PlatformBillingPage, TicketCheckoutPage, TicketOrderPage, TicketsPage } from './pages/FinancialPages';

function IframeRouteNavigation() {
    const navigate = useNavigate();

    React.useEffect(() => {
        const handleNavigation = (event) => {
            const route = event.detail?.route;
            if (typeof route === 'string' && route.startsWith('/')) {
                navigate(route, { replace: true });
            }
        };

        window.addEventListener('horizons:router-navigate', handleNavigation);
        window.dispatchEvent(new Event('horizons:router-ready'));
        return () => window.removeEventListener('horizons:router-navigate', handleNavigation);
    }, [navigate]);

    return null;
}

function App() {
    return (
        <Router>
            <IframeRouteNavigation />
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/join" element={<JoinPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/report" element={<ReportPage />} />
                <Route path="/appeal" element={<AppealPage />} />
                <Route path="/legal" element={<LegalDocumentsPage />} />
                <Route path="/legal/:slug" element={<LegalDocumentsPage />} />
                <Route path="/terms" element={<LegalDocumentsPage documentSlug="terms" />} />
                <Route path="/privacy" element={<LegalDocumentsPage documentSlug="privacy" />} />
                <Route path="/cookies" element={<LegalDocumentsPage documentSlug="cookies" />} />
                <Route path="/community-guidelines" element={<LegalDocumentsPage documentSlug="community-guidelines" />} />
                <Route path="/organizer-terms" element={<LegalDocumentsPage documentSlug="organizer-terms" />} />
                <Route path="/venue-terms" element={<LegalDocumentsPage documentSlug="venue-terms" />} />
                <Route path="/tickets-refunds" element={<LegalDocumentsPage documentSlug="tickets-refunds" />} />
                <Route path="/paid-services" element={<LegalDocumentsPage documentSlug="paid-services" />} />
                <Route path="/marketplace-transparency" element={<LegalDocumentsPage documentSlug="marketplace-transparency" />} />
                <Route path="/company" element={<CompanyInformationPage />} />
                <Route path="/subprocessors" element={<SubprocessorsPage />} />
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/register" element={<AuthPage mode="register" />} />
                <Route path="/check-email" element={<CheckEmailPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin/applications" element={<AdminApplicationsPage />} />
                <Route path="/admin/applications/:id" element={<AdminApplicationPage />} />
                <Route path="/admin/users" element={<UserRolesPage />} />
                <Route path="/admin/reports" element={<AdminReportsPage />} />
                <Route path="/admin/platform-billing" element={<PlatformAdminPage />} />
                <Route path="/admin/venue-owner-applications" element={<AdminVenueApplicationsPage />} />
                <Route path="/become-a-venue-owner" element={<VenueOwnerApplicationPage />} />
                <Route path="/account/billing-profiles" element={<BillingProfilesPage />} />
                <Route path="/billing/payment-account/refresh" element={<PaymentAccountReturnPage refresh />} />
                <Route path="/billing/payment-account/complete" element={<PaymentAccountReturnPage />} />
                <Route path="/account/platform-billing" element={<PlatformBillingPage />} />
                <Route path="/account/tickets" element={<TicketsPage />} />
                <Route path="/tickets/success" element={<TicketsPage success />} />
                <Route path="/tickets/:id" element={<TicketOrderPage />} />
                <Route path="/profile/venues" element={<MyVenuesPage />} />
                <Route path="/profile/saved-venues" element={<SavedVenuesPage />} />
                <Route path="/profile/venues/new" element={<VenueEditorPage />} />
                <Route path="/profile/venues/:id/edit" element={<VenueEditorPage />} />
                <Route path="/profile/venues/:id/bookings" element={<VenueBookingsPage />} />
                <Route path="/profile/venues/:id/calendar" element={<VenueCalendarPage />} />
                <Route path="/profile/invoices" element={<InvoicesPage seller />} />
                <Route path="/account/invoices" element={<InvoicesPage />} />
                <Route path="/invoices/:invoiceId" element={<InvoiceDetailPage />} />
                <Route path="/venues" element={<VenuesDiscoveryPage />} />
                <Route path="/venues/slug/:slug" element={<VenueDetailPage />} />
                <Route path="/venues/:id/availability" element={<OrganizerAvailabilityPage />} />
                <Route path="/venues/:city/:venueType" element={<VenueSearchRoutePage />} />
                <Route path="/venues/:city" element={<VenueCityOrDetailPage />} />
                <Route path="/account-deleted" element={<AccountDeletedPage />} />
                <Route path="/application-sent" element={<ApplicationSentPage />} />
                <Route path="/events" element={<EventsPage key="events" />} />
                <Route path="/profile/events" element={<EventsPage key="manage-events" managementOnly />} />
                <Route path="/profile/events/new" element={<EventsPage key="new-event" managementOnly creationPage />} />
                <Route path="/profile/events/:id/edit" element={<EventsPage key="edit-event" managementOnly editPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/events/:id/tickets" element={<TicketCheckoutPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/groups/:id" element={<GroupsPage detailPage />} />
                <Route path="/profile/groups/:id" element={<GroupsPage managementOnly focusedManagement />} />
                <Route path="/profile/groups" element={<GroupsPage managementOnly />} />
                <Route path="/profile/articles" element={<ArticlesPage view="workspace" />} />
                <Route path="/profile/articles/new" element={<ArticlesPage view="new" />} />
                <Route path="/profile/articles/:id/edit" element={<ArticlesPage view="edit" />} />
                <Route path="/articles/category/:category" element={<ArticlesPage />} />
                <Route path="/articles/:slug" element={<ArticlesPage view="detail" />} />
                <Route path="/articles" element={<ArticlesPage />} />
                <Route path="/:city/groups/:id" element={<GroupSlugRedirect />} />
                <Route path="/invitation-response" element={<InvitationResponsePage />} />
                <Route path="/group-invitation" element={<GroupInvitationPage />} />
            </Routes>
        </Router>
    );
}

export default App;
