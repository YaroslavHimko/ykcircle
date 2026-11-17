import path from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';

// Load production modules with the same alias and JSX runtime as Vite, while
// supplying browser adapters explicitly. No real backend or browser is needed.
export async function browserModule(entry, globals = {}) {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'cjs',
    packages: 'external',
    jsx: 'automatic',
    alias: { '@': path.resolve('src') },
    define: {
      'import.meta.env.VITE_API_URL': '""',
      'import.meta.env.VITE_SITE_DOMAIN': '"ykcircle.test"',
      'import.meta.env.DEV': 'true',
      'import.meta.env.VITE_HERO_IMAGE_VERSION': '"test"',
    },
  });
  const module = { exports: {} };
  runInNewContext(result.outputFiles[0].text, {
    module,
    exports: module.exports,
    require: createRequire(import.meta.url),
    console,
    URL,
    URLSearchParams,
    Headers,
    Intl,
    Event,
    ...globals,
  });
  return module.exports;
}
