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
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return apiAssetUrl(value.startsWith('/') ? value : `/uploads/article-images/${value}`);
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
    throw error;
  }
  return data;
}
