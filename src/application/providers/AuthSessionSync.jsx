import React from 'react';
import { apiFetch } from '@/shared/api/client.js';
export default function AuthSessionSync() {
  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return undefined;
    let active = true;
    apiFetch('/api/auth/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!active) return;
        if (response.ok && data?.user) {
          localStorage.setItem('authUser', JSON.stringify(data.user));
          window.dispatchEvent(new Event('auth-change'));
        } else if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          window.dispatchEvent(new Event('auth-change'));
        }
      })
      .catch(() => {
        /* Keep the existing session during temporary network failures. */
      });
    return () => {
      active = false;
    };
  }, []);
  return null;
}
