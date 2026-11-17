import { Route } from 'react-router-dom';
import MyAttendingEventsPage from '@/features/events/pages/MyAttendingEventsPage.jsx';
import EventsPage from '@/features/events/pages/EventsPage.jsx';
import CreateEventRoute from '../routing/CreateEventRoute.jsx';
import EventDetailPage from '@/features/events/pages/EventDetailPage.jsx';
import EventCheckInPage from '@/features/events/pages/EventCheckInPage.jsx';
import InvitationResponsePage from '@/features/events/pages/InvitationResponsePage.jsx';
export const eventsRoutes = [
  <Route key="/profile/my-events" path="/profile/my-events" element={<MyAttendingEventsPage />} />,
  <Route key="/events" path="/events" element={<EventsPage key="events" />} />,
  <Route
    key="/profile/events"
    path="/profile/events"
    element={<EventsPage key="manage-events" managementOnly />}
  />,
  <Route key="/profile/events/new" path="/profile/events/new" element={<CreateEventRoute />} />,
  <Route
    key="/profile/events/:id/edit"
    path="/profile/events/:id/edit"
    element={<EventsPage key="edit-event" managementOnly editPage />}
  />,
  <Route key="/events/:id" path="/events/:id" element={<EventDetailPage />} />,
  <Route key="/events/:id/check-in" path="/events/:id/check-in" element={<EventCheckInPage />} />,
  <Route
    key="/invitation-response"
    path="/invitation-response"
    element={<InvitationResponsePage />}
  />,
];
