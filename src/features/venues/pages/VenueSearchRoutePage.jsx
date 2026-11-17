import { useParams } from 'react-router-dom';
import { VenuesDiscoveryPage } from './VenuesDiscoveryPage.jsx';
export function VenueSearchRoutePage() {
  const { city, venueType } = useParams();
  return <VenuesDiscoveryPage city={city} venueType={venueType} />;
}
