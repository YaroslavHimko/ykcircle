import assert from 'node:assert/strict';
import test from 'node:test';
import { browserModule } from './helpers/browser-module.js';

async function client({ status = 200, token = 'session-token', pathname = '/events/42' } = {}) {
  const storage = new Map(
    token
      ? [
          ['authToken', token],
          ['authUser', '{"id":1}'],
        ]
      : [],
  );
  const requests = [];
  const redirects = [];
  const events = [];
  const response = { status };
  const api = await browserModule('src/shared/api/client.js', {
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      removeItem: (key) => storage.delete(key),
    },
    window: {
      location: {
        hostname: 'localhost',
        pathname,
        search: '?manage=1',
        hash: '#participants',
        assign: (url) => redirects.push(url),
      },
      dispatchEvent: (event) => events.push(event.type),
    },
    fetch: async (url, options) => {
      requests.push({ url, options });
      return response;
    },
  });
  return { ...api, requests, storage, redirects, events, response };
}

test('optional-auth requests carry the session without overriding explicit credentials', async () => {
  const api = await client();
  assert.equal(await api.apiFetch('/api/events'), api.response);
  assert.equal(api.requests[0].options.headers.Authorization, 'Bearer session-token');
  await api.apiFetch('/api/events', {
    headers: { Authorization: 'Bearer explicit-token', Accept: 'application/json' },
  });
  assert.equal(api.requests[1].options.headers.Authorization, 'Bearer explicit-token');
  assert.equal(api.requests[1].options.headers.Accept, 'application/json');
});

test('required-auth failures clear the session and preserve the complete return location', async () => {
  const api = await client({ status: 401 });
  await api.apiFetch('/api/me', { headers: { Authorization: 'Bearer session-token' } });
  assert.equal(api.storage.size, 0);
  assert.deepEqual(api.events, ['auth-change']);
  assert.deepEqual(api.redirects, ['/login?from=%2Fevents%2F42%3Fmanage%3D1%23participants']);
});

test('an optional-auth 401 does not sign out a session or redirect', async () => {
  const api = await client({ status: 401 });
  await api.apiFetch('/api/auth/login');
  assert.equal(api.storage.get('authToken'), 'session-token');
  assert.deepEqual(api.redirects, []);
  assert.deepEqual(api.events, []);
});

test('anonymous requests stay anonymous and a 401 on login does not redirect again', async () => {
  const anonymous = await client({ token: null });
  await anonymous.apiFetch('/api/events');
  assert.equal(anonymous.requests[0].options.headers, undefined);
  const login = await client({ status: 401, pathname: '/login' });
  await login.apiFetch('/api/me', { headers: { Authorization: 'Bearer expired' } });
  assert.deepEqual(login.redirects, []);
});
