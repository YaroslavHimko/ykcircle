# Contributing

## Starting work

1. Use the Node version in `.nvmrc`, run `npm ci`, then `npm run check`.
2. Choose the feature you own under `src/features`. Start with its route group in
   `src/application/routes` when tracing a screen.
3. Keep changes within the feature where possible. Coordinate edits to its
   `index.js` when another feature needs a new shared capability.
4. Add behavioral regression coverage for changed flows, validation, access
   checks, payments, or request handling. Tests must not contact shared services.
5. Run `npm run format`, `npm run check`, and
   `npm run build -- --outDir .verification-dist` before review.

## Team conventions

- Use JavaScript ES modules, explicit file extensions, `const` by default, and
  descriptive names. React components use `PascalCase.jsx`, hooks use `useName.js`,
  and other modules use lowercase words separated by hyphens.
- Prettier and EditorConfig define whitespace, quotes, and line wrapping. Do not
  compress components or multiple statements onto one line.
- Use relative imports inside a feature or shared module; use `@/` between layers.
  Other features consume only the explicit exports of a feature's `index.js`.
  Internal code imports implementations directly, avoiding its own barrel.
- Route files compose pages and access wrappers. Pages coordinate UI; panels
  receive explicit props; hooks own reusable state and lifecycle; request adapters
  interpret endpoint responses. Extract around a responsibility, not a line count.
- Prefer React state and event handlers over querying or rewriting rendered DOM.
  Effects that load data must account for dependencies and stale responses.
- Keep reusable primitives in `shared/components/ui`. Feature-specific UI stays
  with its feature. Do not make every small helper a shared abstraction.
- Use `shared/api/client.js` for backend transport. Preserve the distinction
  between optional session headers and explicitly authenticated requests.
- Preserve paid-feature gates, signed media URLs, redirect context, and the
  separation between attendee and management views.
- Update the route fixture deliberately when adding or changing routes. It records
  screen props, redirects, keys, and feature gates, not just a list of URLs.
- Keep dependency edits and `package-lock.json` together. Do not commit credentials,
  local `.env` values, editor state, or generated verification output.

## Review expectations

Explain the user-visible trigger and resulting behavior, then list validation and
any limitations. For structural changes, identify ownership and dependency changes.
Keep unrelated feature work in separate changes so several engineers can review
and merge their work independently.

`npm run lint:warn` exposes pre-existing effect-dependency
warnings. Address warnings when modifying the affected behavior; do not blindly
add unstable functions to dependency arrays or disable the rule globally. CI gates
lint errors, formatting, architecture, tests, and the production build.
