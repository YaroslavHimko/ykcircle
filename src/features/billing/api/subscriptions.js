import { apiFetch } from '@/shared/api/client.js';
export async function subscriptionRequest(path, body, method = 'POST') {
  const response = await apiFetch(path, {
    method: body === undefined ? 'GET' : method,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      ...(body === undefined
        ? {}
        : {
            'Content-Type': 'application/json',
          }),
    },
    ...(body === undefined
      ? {}
      : {
          body: JSON.stringify(body),
        }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to complete this request.');
  return data;
}
