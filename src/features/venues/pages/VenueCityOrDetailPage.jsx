import { useParams } from 'react-router-dom';
import { VenuesDiscoveryPage } from './VenuesDiscoveryPage.jsx';
import { VenueDetailPage } from './VenueDetailPage.jsx';
export function VenueCityOrDetailPage() {
  const { city } = useParams();
  return /^\d+$/.test(city || '') ? (
    <VenueDetailPage legacyId managed />
  ) : (
    <VenuesDiscoveryPage city={city} />
  );
}
