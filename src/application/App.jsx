import { BrowserRouter } from 'react-router-dom';
import AuthSessionSync from './providers/AuthSessionSync.jsx';
import IframeRouteNavigation from './routing/IframeRouteNavigation.jsx';
import ScrollToTop from './routing/ScrollToTop.jsx';
import AppRoutes from './routing/AppRoutes.jsx';
export default function App() {
  return (
    <BrowserRouter>
      <AuthSessionSync />
      <IframeRouteNavigation />
      <ScrollToTop />
      <AppRoutes />
    </BrowserRouter>
  );
}
