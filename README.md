# YKCircle frontend

React application for YKCircle events, groups, venues, articles, and account management.
The backend lives in the separate `ykcircle-node` repository.

## Development

Use Node **24.11.1** (see `.nvmrc`) and npm:

```sh
npm ci
npm run dev
```

Start the backend separately on port 3001. Vite proxies `/api` to that backend.
Copy `.env.example` to `.env` only when you need to override the defaults.
In PowerShell, use `npm.cmd` if your execution policy blocks `npm.ps1`.

## Commands

| Command                                        | Purpose                                                      |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `npm run dev`                                  | Vite development server                                      |
| `npm run check`                                | Lint errors, formatting, architecture, and tests             |
| `npm run lint:warn`                            | Include existing effect-dependency warnings                  |
| `npm run format`                               | Apply the shared formatting rules                            |
| `npm test`                                     | Run behavioral and architecture regression tests             |
| `npm run build`                                | Production build into `dist`                                 |
| `npm run build -- --outDir .verification-dist` | Verify a build without changing tracked deployment artifacts |
| `npm run preview`                              | Serve the production build locally                           |

Commit `package-lock.json` with dependency changes; CI uses `npm ci` on Linux and Windows.

## Source layout

```text
src/
  main.jsx                 Browser entry point
  application/             App composition, route groups, startup effects, styles
  features/<feature>/      Screens and behavior owned by a product feature
    pages/                 Route-level screens
    components/            Feature UI and panels
    hooks/                 Stateful reusable behavior, where needed
    api/                   Feature-specific request adapters, where needed
    model/                 Feature values, normalization, and formatting
    index.js               Explicit interface for other features, where needed
  shared/                  API transport, reusable UI, media, maps, and utilities
test/                      Regression tests and the original route contract
tools/                     Local checks and development scripts
plugins/                   Existing Horizons editor integrations
```

Start with [the architecture guide](docs/ARCHITECTURE.md) and
[contributor workflow](CONTRIBUTING.md). Folder types are optional: create them when
a feature has code that belongs there, rather than adding empty scaffolding.

## Public build configuration

`VITE_SITE_DOMAIN` controls the public site domain. `VITE_API_URL` overrides the API
origin; `API_URL` is accepted as a build-time fallback. These values are public
and embedded during the build. Rebuild when changing them. Never place credentials
in `VITE_*` variables. Local production previews default to `http://localhost:3001`.

The repository retains existing deployment artifacts under `dist`; development
verification uses `.verification-dist` to keep source reviews separate from output.
