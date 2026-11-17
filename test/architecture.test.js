import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { checkArchitecture, dependencyError, findCycles } from '../tools/architecture.js';

test('feature interfaces and shared modules enforce ownership boundaries', () => {
  assert.equal(
    dependencyError('src/features/events/pages/EventsPage.jsx', 'src/features/venues/index.js'),
    null,
  );
  assert.match(
    dependencyError(
      'src/features/events/pages/EventsPage.jsx',
      'src/features/venues/pages/VenueEditorPage.jsx',
    ),
    /interface/,
  );
  assert.match(
    dependencyError('src/shared/utils/time.js', 'src/features/venues/index.js'),
    /Shared/,
  );
  assert.match(
    dependencyError('src/features/events/index.js', 'src/features/events/pages/EventsPage.jsx'),
    /page/,
  );
  assert.match(
    dependencyError('src/features/events/api/events.js', 'src/application/App.jsx'),
    /application/,
  );
  assert.match(
    dependencyError('src/shared/components/ui/button.jsx', 'src/shared/api/client.js'),
    /primitives/,
  );
});

test('cycles include indirect dependencies and self-imports', () => {
  assert.deepEqual(
    findCycles(
      new Map([
        ['a', ['b']],
        ['b', ['c']],
        ['c', ['a']],
      ]),
    ),
    [['a', 'b', 'c', 'a']],
  );
  assert.deepEqual(findCycles(new Map([['a', ['a']]])), [['a', 'a']]);
  assert.deepEqual(
    findCycles(
      new Map([
        ['a', ['c']],
        ['b', ['c']],
        ['c', []],
      ]),
    ),
    [],
  );
});

test('the scanner checks re-exports, dynamic imports, and exact filename casing', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ykcircle-architecture-'));
  t.after(() => {
    const resolved = path.resolve(root);
    assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep));
    assert.ok(path.basename(resolved).startsWith('ykcircle-architecture-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  const write = (file, value) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), value);
  };
  write(
    'src/shared/one.js',
    "export { two } from '../features/events/two.js'; import('./Missing.js');",
  );
  write('src/features/events/two.js', 'export const two = 2;');
  write('src/shared/missing.js', 'export const value = 1;');
  const { errors } = checkArchitecture(root);
  assert.equal(errors.length, 2);
  assert.ok(errors.some((message) => message.includes('Shared modules')));
  assert.ok(errors.some((message) => message.includes('Unresolved import ./Missing.js')));
});
