import { SITE_DOMAIN } from '@/config';

const getApiOrigin = () => {
  const hostname = window.location.hostname;

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  // Vite's development server proxies /api, while `vite preview` does not.
  // Point preview builds at the local API so API 404s are not HTML fallback
  // pages served by the frontend.
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
    return import.meta.env.DEV ? '' : 'http://localhost:3001';
  }

  // Keep local development on Vite's /api proxy. In production, route to the
  // API subdomain (for example, https://api.domain.com).
  if (import.meta.env.DEV) return '';

  return `${window.location.protocol}//api.${SITE_DOMAIN}`;
};

export const apiUrl = (path) => `${getApiOrigin()}${path}`;

export const apiAssetUrl = (path) => {
  const hostname = window.location.hostname;
  if (import.meta.env.VITE_API_URL) return `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}${path}`;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return `http://localhost:3001${path}`;
  return `${window.location.protocol}//api.${SITE_DOMAIN}${path}`;
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  window.dispatchEvent(new Event('auth-change'));

  const from = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const loginUrl = `/login?from=${encodeURIComponent(from)}`;
  if (window.location.pathname !== '/login') window.location.assign(loginUrl);
};

export const apiFetch = async (path, options = {}) => {
  // Endpoints that use optionalAuthenticate (venue/group/event detail lookups,
  // for example) personalize their response - e.g. deciding whether a private
  // or draft resource's image needs a signed token - only when a bearer token
  // is actually sent. Attach one whenever we have it and the caller hasn't
  // already set an explicit Authorization header, without changing whether a
  // 401 is treated as "your session expired": that still only fires for
  // callers that explicitly required auth, so a stray 401 from an unrelated
  // endpoint (e.g. a failed login attempt) can't log out an unrelated session.
  const requiresAuth = Boolean(options.headers?.Authorization);
  const token = !requiresAuth && localStorage.getItem('authToken');
  const headers = token ? { ...options.headers, Authorization: `Bearer ${token}` } : options.headers;
  const response = await fetch(apiUrl(path), { ...options, headers });

  if (response.status === 401 && requiresAuth) {
    clearAuthAndRedirect();
  }

  return response;
};
