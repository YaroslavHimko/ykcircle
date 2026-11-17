import { apiFetch } from '@/shared/api/client.js';
export async function billingRequest(path, options = {}) {
  const response = await apiFetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      ...(options.body
        ? {
            'Content-Type': 'application/json',
          }
        : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      [
        data?.error || data?.message || 'Unable to complete this request.',
        ...Object.values(data?.fields || {}),
      ].join(' '),
    );
  return data;
}
