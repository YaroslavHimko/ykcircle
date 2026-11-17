import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { Children, isValidElement } from 'react';
import { createRoutesFromElements, matchRoutes } from 'react-router-dom';
import { browserModule } from './helpers/browser-module.js';

const fixture = JSON.parse(
  fs.readFileSync(new URL('./fixtures/routes.json', import.meta.url), 'utf8'),
);

function describeElement(element) {
  const { children, ...props } = element.props;
  if (element.key !== null) props.key = element.key;
  const describedChildren = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child)) describedChildren.push(describeElement(child));
  });
  return {
    component: element.type.name,
    props,
    children: describedChildren,
  };
}

test('all original routes retain their screens, modes, redirects, and feature gates', async () => {
  const { applicationRoutes } = await browserModule('src/application/routing/AppRoutes.jsx');
  const routes = createRoutesFromElements(applicationRoutes);
  const actual = routes.map(({ path, element }) => ({ path, element: describeElement(element) }));
  const byPath = (a, b) => a.path.localeCompare(b.path);
  // JSON normalizes objects produced in the isolated browser context.
  assert.deepEqual(JSON.parse(JSON.stringify(actual)).sort(byPath), [...fixture].sort(byPath));
  assert.equal(new Set(routes.map((route) => route.path)).size, fixture.length);

  for (const [url, expected] of [
    ['/profile/events/new', '/profile/events/new'],
    ['/events/42/check-in', '/events/:id/check-in'],
    ['/tickets/success', '/tickets/success'],
    ['/venues/slug/a-hall', '/venues/slug/:slug'],
    ['/venues/42/availability', '/venues/:id/availability'],
    ['/articles/category/music', '/articles/category/:category'],
    ['/account/payments/venues', '/account/payments/:area'],
  ]) {
    assert.equal(matchRoutes(routes, url).at(-1).route.path, expected, url);
  }
});
