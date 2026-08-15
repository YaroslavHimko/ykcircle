import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
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
import AdminApplicationPage from './pages/AdminApplicationPage';
import AccountDeletedPage from './pages/AccountDeletedPage';
import ApplicationSentPage from './pages/ApplicationSentPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import InvitationResponsePage from './pages/InvitationResponsePage';
import UserRolesPage from './pages/UserRolesPage';
import GroupsPage from './pages/GroupsPage';
import CommunityPage from './pages/CommunityPage';
import AdminCommunityReportsPage from './pages/AdminCommunityReportsPage';
import GroupSlugRedirect from './pages/GroupSlugRedirect';
import ArticlesPage from './pages/ArticlesPage';

function App() {
    return (
        <Router>
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/join" element={<JoinPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/register" element={<AuthPage mode="register" />} />
                <Route path="/check-email" element={<CheckEmailPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin/applications" element={<AdminApplicationsPage />} />
                <Route path="/admin/applications/:id" element={<AdminApplicationPage />} />
                <Route path="/admin/users" element={<UserRolesPage />} />
                <Route path="/admin/community/reports" element={<AdminCommunityReportsPage />} />
                <Route path="/account-deleted" element={<AccountDeletedPage />} />
                <Route path="/application-sent" element={<ApplicationSentPage />} />
                <Route path="/events" element={<EventsPage key="events" />} />
                <Route path="/profile/events" element={<EventsPage key="manage-events" managementOnly />} />
                <Route path="/profile/events/new" element={<EventsPage key="new-event" managementOnly creationPage />} />
                <Route path="/profile/events/:id/edit" element={<EventsPage key="edit-event" managementOnly editPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/groups/:id" element={<GroupsPage detailPage />} />
                <Route path="/profile/groups" element={<GroupsPage managementOnly />} />
                <Route path="/profile/community" element={<CommunityPage mode="mine" />} />
                <Route path="/profile/community/:id/event" element={<CommunityPage mode="event-link" />} />
                <Route path="/profile/community/:id/edit" element={<CommunityPage mode="edit" />} />
                <Route path="/profile/articles" element={<ArticlesPage view="workspace" />} />
                <Route path="/profile/articles/new" element={<ArticlesPage view="new" />} />
                <Route path="/profile/articles/:id/edit" element={<ArticlesPage view="edit" />} />
                <Route path="/articles/category/:category" element={<ArticlesPage />} />
                <Route path="/articles/:slug" element={<ArticlesPage view="detail" />} />
                <Route path="/articles" element={<ArticlesPage />} />
                <Route path="/:city/community/new" element={<CommunityPage mode="create" />} />
                <Route path="/:city/community/post/:slug/events" element={<CommunityPage mode="linked-events" />} />
                <Route path="/:city/community/post/:slug" element={<CommunityPage mode="detail" />} />
                <Route path="/:city/community/:category/:subcategory" element={<CommunityPage />} />
                <Route path="/:city/community/:category" element={<CommunityPage />} />
                <Route path="/:city/community" element={<CommunityPage />} />
                <Route path="/:city/groups/:id" element={<GroupSlugRedirect />} />
                <Route path="/invitation-response" element={<InvitationResponsePage />} />
            </Routes>
        </Router>
    );
}

export default App;
