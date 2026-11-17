import { useNavigate } from 'react-router-dom';
import React from 'react';
export default function IframeRouteNavigation() {
  const navigate = useNavigate();
  React.useEffect(() => {
    const handleNavigation = (event) => {
      const route = event.detail?.route;
      if (typeof route === 'string' && route.startsWith('/')) {
        navigate(route, {
          replace: true,
        });
      }
    };
    window.addEventListener('horizons:router-navigate', handleNavigation);
    window.dispatchEvent(new Event('horizons:router-ready'));
    return () => window.removeEventListener('horizons:router-navigate', handleNavigation);
  }, [navigate]);
  return null;
}
