import { Route } from 'react-router-dom';
import GroupsPage from '@/features/groups/pages/GroupsPage.jsx';
import GroupSlugRedirect from '@/features/groups/pages/GroupSlugRedirect.jsx';
import GroupInvitationPage from '@/features/groups/pages/GroupInvitationPage.jsx';
export const groupsRoutes = [
  <Route key="/groups" path="/groups" element={<GroupsPage />} />,
  <Route key="/groups/:id" path="/groups/:id" element={<GroupsPage detailPage />} />,
  <Route
    key="/profile/groups/:id"
    path="/profile/groups/:id"
    element={<GroupsPage managementOnly focusedManagement />}
  />,
  <Route key="/profile/groups" path="/profile/groups" element={<GroupsPage managementOnly />} />,
  <Route key="/:city/groups/:id" path="/:city/groups/:id" element={<GroupSlugRedirect />} />,
  <Route key="/group-invitation" path="/group-invitation" element={<GroupInvitationPage />} />,
];
