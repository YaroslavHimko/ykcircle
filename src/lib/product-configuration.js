import { useEffect, useState } from 'react';
import { apiFetch } from './api';
export function useProductConfiguration() {
  const [configuration, setConfiguration] = useState({ subscriptionsEnabled: false, paidEventsEnabled: false, paidVenuesEnabled: false, loading: true });
  useEffect(() => { let active = true; apiFetch('/api/product-configuration').then(async (response) => { if (!response.ok) throw new Error('Configuration unavailable'); return response.json(); }).then((data) => { if (active) setConfiguration({ ...data, loading: false }); }).catch(() => { if (active) setConfiguration((current) => ({ ...current, loading: false, error: true })); }); return () => { active = false; }; }, []);
  return configuration;
}
