import { apiFetch } from '@/shared/api/client.js';
export const auth = () => ({
  Authorization: 'Bearer ' + localStorage.getItem('authToken'),
});
export const money = (amount, currency = 'SEK') =>
  new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency,
  }).format(Number(amount || 0));
export const user = () => {
  try {
    return JSON.parse(localStorage.getItem('authUser') || 'null');
  } catch {
    return null;
  }
};
export const when = (value, timezone) => {
  if (!value) return 'To be announced';
  const text = String(value).replace(' ', 'T');
  const instant = new Date(/(Z|[+-]\d\d:\d\d)$/.test(text) ? text : text + 'Z');
  return Number.isNaN(instant.getTime())
    ? 'To be announced'
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: timezone || 'UTC',
      }).format(instant);
};
export async function request(path, options = {}) {
  const response = await apiFetch(path, {
    ...options,
    headers: {
      ...auth(),
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to load tickets.');
  return data;
}
