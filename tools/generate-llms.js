#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import { sourceFiles } from './architecture.js';

const traverse = traverseModule.default;

const CLEAN_CONTENT_REGEX = {
  comments: /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
  templateLiterals: /`[\s\S]*?`/g,
  strings: /'[^']*'|"[^"]*"/g,
  jsxExpressions: /\{.*?\}/g,
  htmlEntities: {
    quot: /&quot;/g,
    amp: /&amp;/g,
    lt: /&lt;/g,
    gt: /&gt;/g,
    apos: /&apos;/g,
  },
};

const EXTRACTION_REGEX = {
  route: /<Route\s+[^>]*>/g,
  path: /path=["']([^"']+)["']/,
  element: /element=\{<(\w+)[^}]*\/?\s*>\}/,
  helmet: /<Helmet[^>]*?>([\s\S]*?)<\/Helmet>/i,
  helmetTest: /<Helmet[\s\S]*?<\/Helmet>/i,
  title: /<title[^>]*?>\s*(.*?)\s*<\/title>/i,
  description: /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i,
};

function cleanContent(content) {
  return content
    .replace(CLEAN_CONTENT_REGEX.comments, '')
    .replace(CLEAN_CONTENT_REGEX.templateLiterals, '""')
    .replace(CLEAN_CONTENT_REGEX.strings, '""');
}

function cleanText(text) {
  if (!text) return text;

  return text
    .replace(CLEAN_CONTENT_REGEX.jsxExpressions, '')
    .replace(CLEAN_CONTENT_REGEX.htmlEntities.quot, '"')
    .replace(CLEAN_CONTENT_REGEX.htmlEntities.amp, '&')
    .replace(CLEAN_CONTENT_REGEX.htmlEntities.lt, '<')
    .replace(CLEAN_CONTENT_REGEX.htmlEntities.gt, '>')
    .replace(CLEAN_CONTENT_REGEX.htmlEntities.apos, "'")
    .trim();
}

function extractRoutes(filename) {
  const routes = new Map();
  const ast = parse(fs.readFileSync(filename, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  traverse(ast, {
    JSXElement(p) {
      if (p.node.openingElement.name.name !== 'Route') return;
      const attributes = p.node.openingElement.attributes;
      const routePath = attributes.find((a) => a.name?.name === 'path')?.value?.value;
      const element = attributes.find((a) => a.name?.name === 'element')?.value?.expression;
      if (!routePath || routePath.includes(':') || !element) return;
      const componentName = element.openingElement?.name.name;
      if (!componentName || componentName === 'Navigate') return;
      const previous = routes.get(componentName);
      if (!previous || routePath.length < previous.length) routes.set(componentName, routePath);
    },
  });
  return routes;
}

function findReactFiles(directory) {
  return sourceFiles(directory).filter((file) => file.endsWith('.jsx'));
}

function extractHelmetData(content, filePath, routes) {
  const cleanedContent = cleanContent(content);

  if (!EXTRACTION_REGEX.helmetTest.test(cleanedContent)) {
    return null;
  }

  const helmetMatch = content.match(EXTRACTION_REGEX.helmet);
  if (!helmetMatch) return null;

  const helmetContent = helmetMatch[1];
  const titleMatch = helmetContent.match(EXTRACTION_REGEX.title);
  const descMatch = helmetContent.match(EXTRACTION_REGEX.description);

  const title = cleanText(titleMatch?.[1]);
  const description = cleanText(descMatch?.[1]);

  const fileName = path.basename(filePath, path.extname(filePath));
  const url =
    routes.size && routes.has(fileName) ? routes.get(fileName) : generateFallbackUrl(fileName);

  return {
    url,
    title: title || 'Untitled Page',
    description: description || 'No description available',
  };
}

function generateFallbackUrl(fileName) {
  const cleanName = fileName.replace(/Page$/, '').toLowerCase();
  return cleanName === 'app' ? '/' : `/${cleanName}`;
}

function generateLlmsTxt(pages) {
  const sortedPages = pages.sort((a, b) => a.title.localeCompare(b.title));
  const pageEntries = sortedPages
    .map((page) => `- [${page.title}](${page.url}): ${page.description}`)
    .join('\n');

  return `## Pages\n${pageEntries}`;
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function processPageFile(filePath, routes) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return extractHelmetData(content, filePath, routes);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return null;
  }
}

function main() {
  const pagesDir = path.join(process.cwd(), 'src', 'features');
  const routesDir = path.join(process.cwd(), 'src', 'application', 'routes');
  const routes = new Map(findReactFiles(routesDir).flatMap((file) => [...extractRoutes(file)]));
  const reactFiles = findReactFiles(pagesDir).filter((file) =>
    file.includes(`${path.sep}pages${path.sep}`),
  );
  const pages = reactFiles.map((file) => processPageFile(file, routes)).filter(Boolean);

  if (pages.length === 0) {
    console.error('❌ No pages with Helmet components found!');
    process.exit(1);
  }

  const llmsTxtContent = generateLlmsTxt(pages);
  const outputPath = path.join(process.cwd(), 'public', 'llms.txt');

  ensureDirectoryExists(path.dirname(outputPath));
  fs.writeFileSync(outputPath, llmsTxtContent, 'utf8');
}

const isMainModule =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMainModule) {
  main();
}
