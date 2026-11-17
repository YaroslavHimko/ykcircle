import { spawnSync } from 'node:child_process';
import { sourceFiles } from './architecture.js';

const files = [...sourceFiles('src'), ...sourceFiles('test')].filter((file) =>
  file.endsWith('.test.js'),
);
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
