import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { loadConfigFromFile } from 'vite';
import { runInNewContext } from 'node:vm';

async function browserApi(t, { apiUrl = '', viteApiUrl = '' } = {}) {
  const names = ['API_URL', 'VITE_API_URL', 'AUTH_SECRET'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  t.after(() => {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  });
  process.env.API_URL = apiUrl;
  process.env.VITE_API_URL = viteApiUrl;
  process.env.AUTH_SECRET = 'private-test-sentinel';
  const { config } = await loadConfigFromFile({ command: 'build', mode: 'production' });
  const bundled = await build({
    entryPoints: ['src/lib/api.js'], bundle: true, write: false, format: 'cjs',
    alias: { '@': './src' },
    define: {
      ...config.define,
      'import.meta.env.VITE_SITE_DOMAIN': JSON.stringify('staging.ykcircle.com'),
      'import.meta.env.DEV': 'false',
    },
  });
  const code = bundled.outputFiles[0].text;
  assert.ok(!code.includes('private-test-sentinel'), 'Server secrets must not reach the browser');
  const module = { exports: {} };
  runInNewContext(code, { module, exports: module.exports, window: { location: { hostname: 'staging.ykcircle.com', protocol: 'https:' } } });
  return module.exports;
}

test('frontend API_URL directs both requests and media to the staging API', async t => {
  const api = await browserApi(t, { apiUrl: 'https://staging-api.ykcircle.com/' });
  assert.equal(api.apiUrl('/api/events'), 'https://staging-api.ykcircle.com/api/events');
  assert.equal(api.apiAssetUrl('/api/media/event/cover.png'), 'https://staging-api.ykcircle.com/api/media/event/cover.png');
});

test('explicit VITE_API_URL takes precedence over API_URL', async t => {
  const api = await browserApi(t, { apiUrl: 'https://ignored.example', viteApiUrl: 'https://override.example/' });
  assert.equal(api.apiUrl('/api/events'), 'https://override.example/api/events');
  assert.equal(api.apiAssetUrl('/uploads/test.png'), 'https://override.example/uploads/test.png');
});

test('missing API overrides preserve the existing API subdomain fallback', async t => {
  const api = await browserApi(t);
  assert.equal(api.apiUrl('/api/events'), 'https://api.staging.ykcircle.com/api/events');
});
