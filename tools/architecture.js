import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default;
const sourceExtension = /\.(js|jsx)$/;
const slash = (value) => value.replaceAll('\\', '/');

export function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(filename)
      : sourceExtension.test(filename)
        ? [filename]
        : [];
  });
}

export function moduleLayer(filename) {
  const parts = slash(filename).split('/');
  if (parts[0] !== 'src') return { layer: 'external' };
  return { layer: parts[1], feature: parts[1] === 'features' ? parts[2] : null };
}

export function dependencyError(importer, target) {
  const from = moduleLayer(importer);
  const to = moduleLayer(target);
  if (target === 'src/main.jsx') return 'The executable entry point cannot be imported.';
  if (to.layer === 'external') {
    return importer === 'src/shared/config/site.js' && target === 'site.config.js'
      ? null
      : 'Application code cannot import build tooling or repository files.';
  }
  if (importer === 'src/main.jsx' || from.layer === 'application') return null;
  if (from.layer === 'shared' && to.layer !== 'shared')
    return 'Shared modules cannot depend on features or application setup.';
  if (from.layer === 'features') {
    if (to.layer === 'application') return 'Features cannot import application setup or routes.';
    if (
      to.layer === 'features' &&
      from.feature !== to.feature &&
      target !== `src/features/${to.feature}/index.js`
    ) {
      return 'Cross-feature imports must use the target feature index.js interface.';
    }
    if (importer.endsWith('/index.js') && target.includes('/pages/'))
      return 'Feature interfaces must not export page implementations.';
  }
  if (
    importer.startsWith('src/shared/components/ui/') &&
    !target.startsWith('src/shared/components/ui/') &&
    !target.startsWith('src/shared/utils/')
  ) {
    return 'UI primitives may depend only on other primitives and utilities.';
  }
  return null;
}

function importsIn(code) {
  const imports = [];
  const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
  const record = (node) => {
    if (node?.type === 'StringLiteral') imports.push(node.value);
  };
  traverse(ast, {
    ImportDeclaration(p) {
      record(p.node.source);
    },
    ExportNamedDeclaration(p) {
      record(p.node.source);
    },
    ExportAllDeclaration(p) {
      record(p.node.source);
    },
    CallExpression(p) {
      if (p.node.callee.type === 'Import') record(p.node.arguments[0]);
      if (p.node.callee.name === 'require') record(p.node.arguments[0]);
    },
  });
  return imports;
}

export function findCycles(graph) {
  const active = new Set();
  const visited = new Set();
  const stack = [];
  const cycles = [];
  function visit(node) {
    if (active.has(node)) {
      cycles.push([...stack.slice(stack.indexOf(node)), node]);
      return;
    }
    if (visited.has(node)) return;
    active.add(node);
    stack.push(node);
    for (const dependency of graph.get(node) || []) visit(dependency);
    stack.pop();
    active.delete(node);
    visited.add(node);
  }
  for (const node of graph.keys()) visit(node);
  return cycles;
}

export function checkArchitecture(root) {
  const errors = [];
  const files = sourceFiles(path.join(root, 'src'));
  const graph = new Map();
  const known = new Set(files.map((file) => slash(path.relative(root, file))));
  for (const directory of ['pages', 'components', 'lib']) {
    if (fs.existsSync(path.join(root, 'src', directory)))
      errors.push(`Remove the legacy src/${directory} directory.`);
  }
  for (const filename of files) {
    const relative = slash(path.relative(root, filename));
    const { layer } = moduleLayer(relative);
    if (relative !== 'src/main.jsx' && !['application', 'features', 'shared'].includes(layer))
      errors.push(`${relative}: Unknown source layer.`);
    const dependencies = [];
    try {
      for (const specifier of importsIn(fs.readFileSync(filename, 'utf8'))) {
        if (!specifier.startsWith('.') && !specifier.startsWith('@/')) {
          if (specifier.startsWith('node:') && !relative.endsWith('.test.js'))
            errors.push(`${relative}: Node.js modules do not belong in the browser.`);
          continue;
        }
        const resolved = specifier.startsWith('@/')
          ? path.resolve(root, 'src', specifier.slice(2))
          : path.resolve(path.dirname(filename), specifier);
        const target = slash(path.relative(root, resolved));
        // Checking the known filename also catches casing mistakes on Windows.
        if (
          sourceExtension.test(target)
            ? !known.has(target) && target !== 'site.config.js'
            : !fs.existsSync(resolved)
        ) {
          errors.push(
            `${relative}: Unresolved import ${specifier}. Use exact casing and an explicit extension.`,
          );
          continue;
        }
        if (relative.endsWith('.test.js')) continue;
        if (target.endsWith('.test.js'))
          errors.push(`${relative}: Production code cannot import tests.`);
        const violation = dependencyError(relative, target);
        if (violation) errors.push(`${relative} -> ${target}: ${violation}`);
        if (sourceExtension.test(target)) dependencies.push(target);
      }
    } catch (error) {
      errors.push(`${relative}: ${error.message}`);
    }
    graph.set(relative, dependencies);
  }
  for (const cycle of findCycles(graph)) errors.push(`Import cycle: ${cycle.join(' -> ')}`);
  return { errors, moduleCount: files.length };
}
