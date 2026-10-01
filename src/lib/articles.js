import { apiAssetUrl, apiFetch } from '@/lib/api';

export const articleSlug = (value = '') => String(value)
  .trim()
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 180);

export const articleImageUrl = (value) => {
  const path = String(value || '').trim();
  if (!path) return '';

  // The API may return either a filename or its upload path. Keep a supplied
  // path intact rather than treating it as a filename a second time.
  if (/^(https?:)?\/\//i.test(path) || /^data:image\//i.test(path)) return path;
  if (/^\/?(?:api\/)?uploads\//i.test(path)) return apiAssetUrl(`/${path.replace(/^\/?api\//i, '')}`);
  if (/^\/?article-images\//i.test(path)) return apiAssetUrl(`/uploads/${path.replace(/^\//, '')}`);
  if (/^\/images\//i.test(path)) return path;

  return apiAssetUrl(`/uploads/article-images/${path.replace(/^\//, '')}`);
};

export const articleDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
};

export const articleHeaders = (token, headers = {}) => ({
  ...headers,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export async function articleRequest(path, { token, body, headers, ...options } = {}) {
  const response = await apiFetch(path, {
    ...options,
    headers: articleHeaders(token, headers),
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Unable to complete that article request.');
    error.fields = data.fields || {};
    error.status = response.status;
    error.code = data.code;
    error.subscribeUrl = data.subscribeUrl;
    error.resetsAt = data.resetsAt;
    throw error;
  }
  return data;
}
