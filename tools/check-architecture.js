import { checkArchitecture } from './architecture.js';

const result = checkArchitecture(process.cwd());
if (result.errors.length) {
  console.error(result.errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Architecture checked: ${result.moduleCount} modules, no boundary violations or cycles.`,
  );
}
