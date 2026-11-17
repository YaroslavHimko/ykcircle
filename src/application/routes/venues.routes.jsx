import { Route } from 'react-router-dom';
import { MyVenuesPage } from '@/features/venues/pages/MyVenuesPage.jsx';
import { SavedVenuesPage } from '@/features/venues/pages/SavedVenuesPage.jsx';
import { VenueEditorPage } from '@/features/venues/pages/VenueEditorPage.jsx';
import { VenueBookingsPage } from '@/features/venues/pages/VenueBookingsPage.jsx';
import { VenueCalendarPage } from '@/features/venues/pages/VenueCalendarPage.jsx';
import { VenuesDiscoveryPage } from '@/features/venues/pages/VenuesDiscoveryPage.jsx';
import { VenueDetailPage } from '@/features/venues/pages/VenueDetailPage.jsx';
import { OrganizerAvailabilityPage } from '@/features/venues/pages/OrganizerAvailabilityPage.jsx';
import { VenueSearchRoutePage } from '@/features/venues/pages/VenueSearchRoutePage.jsx';
import { VenueCityOrDetailPage } from '@/features/venues/pages/VenueCityOrDetailPage.jsx';
export const venuesRoutes = [
  <Route key="/profile/venues" path="/profile/venues" element={<MyVenuesPage />} />,
  <Route key="/profile/saved-venues" path="/profile/saved-venues" element={<SavedVenuesPage />} />,
  <Route key="/profile/venues/new" path="/profile/venues/new" element={<VenueEditorPage />} />,
  <Route
    key="/profile/venues/:id/edit"
    path="/profile/venues/:id/edit"
    element={<VenueEditorPage />}
  />,
  <Route
    key="/profile/venues/:id/bookings"
    path="/profile/venues/:id/bookings"
    element={<VenueBookingsPage />}
  />,
  <Route
    key="/profile/venues/:id/calendar"
    path="/profile/venues/:id/calendar"
    element={<VenueCalendarPage />}
  />,
  <Route key="/venues" path="/venues" element={<VenuesDiscoveryPage />} />,
  <Route key="/venues/slug/:slug" path="/venues/slug/:slug" element={<VenueDetailPage />} />,
  <Route
    key="/venues/:id/availability"
    path="/venues/:id/availability"
    element={<OrganizerAvailabilityPage />}
  />,
  <Route
    key="/venues/:city/:venueType"
    path="/venues/:city/:venueType"
    element={<VenueSearchRoutePage />}
  />,
  <Route key="/venues/:city" path="/venues/:city" element={<VenueCityOrDetailPage />} />,
];
