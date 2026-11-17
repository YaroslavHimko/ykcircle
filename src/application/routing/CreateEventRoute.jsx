import { useLocation, Navigate } from 'react-router-dom';
import EventsPage from '@/features/events/pages/EventsPage.jsx';
export default function CreateEventRoute() {
  const location = useLocation();
  if (!localStorage.getItem('authToken')) {
    return (
      <Navigate
        to={`/login?from=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }
  return <EventsPage key="new-event" managementOnly creationPage />;
}
