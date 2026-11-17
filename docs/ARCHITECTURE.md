# Frontend architecture

The frontend is one React/Vite application with three source layers. The backend
uses technical layers around HTTP, persistence, and services. The frontend uses
feature ownership around screens, with a small composition layer and shared
infrastructure. Both repositories use explicit imports, automated boundaries,
consistent formatting, and checks that run on Windows and Linux.

## Dependency direction

| Layer                | Responsibility                                                | May import                                                         |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| `application`        | Browser app composition, routing, startup effects, global CSS | Any frontend layer                                                 |
| `features/<feature>` | Screens, panels, state, feature API adapters and values       | Its own implementations, shared code, another feature's `index.js` |
| `shared`             | Reusable infrastructure and components                        | Shared implementations only                                        |

`src/main.jsx` is the executable browser entry point. No other module imports it.
`shared/config/site.js` is the explicit exception that reads the repository's
public `site.config.js`. UI primitives depend only on primitives and utilities.
Source code cannot import build tooling or tests.

`npm run check:architecture` parses static imports, re-exports, and literal dynamic
imports. It verifies resolution, casing, layer direction, public feature interfaces,
and cycles. It also rejects recreation of the old flat `src/pages`, `src/components`,
and `src/lib` trees. The production build verifies named exports and package resolution.
These checks do not inspect arbitrary computed imports or replace behavioral review.

## Feature ownership

| Feature       | Owned behavior                                                        |
| ------------- | --------------------------------------------------------------------- |
| `account`     | Profile and account settings                                          |
| `admin`       | Platform configuration, users, reports, contact moderation            |
| `articles`    | Discovery, reading, editorial workspace, writing                      |
| `auth`        | Sign-in, registration, verification, recovery, deletion confirmation  |
| `billing`     | Business identities, organizations, payments, invoices, subscriptions |
| `discussions` | Reusable event/group discussion workflow                              |
| `events`      | Discovery, editing, attendance, participant management, invitations   |
| `groups`      | Discovery, membership, invitations, group management                  |
| `legal`       | Legal documents and operator information                              |
| `marketing`   | Home, about, joining                                                  |
| `support`     | Contact, reporting, appeals                                           |
| `tickets`     | Ticket checkout, orders, QR scanning, ticket types                    |
| `venues`      | Discovery, editing, bookings, availability, calendars                 |

Cross-feature dependencies are deliberately small. Groups and marketing consume
the public event card. Events consume venue conversations, ticket UI, billing
identity controls, and discussions. Admin consumes billing's subscription controls
and request adapter. Features must not expose their page modules through `index.js`.

## Routes and startup

Each `application/routes/<feature>.routes.jsx` exports an explicit array of React
Router routes. `application/routing/AppRoutes.jsx` composes those arrays. This lets
engineers change different route groups without editing one large JSX file.
Keep route registration explicit; do not discover routes dynamically from filenames.

`PaidFeatureRoute` retains the existing feature-loading and early-access behavior.
`CreateEventRoute` retains the login redirect and complete creation-page context.
The application also mounts session refresh, scroll restoration, and the existing
Horizons iframe navigation adapter. These effects are separate from page definitions.

`test/fixtures/routes.json` records the 84 routes before the refactor. The route test
loads the actual composed route array and checks component names, props, keys,
redirects, gates, and representative route matching precedence.

## Adding a feature

1. Add its page under `features/<feature>/pages`.
2. Keep UI sections in `components`, reusable state in `hooks`, and endpoint
   response handling in `api` as those responsibilities emerge.
3. Put normalization, constants, and formatting in `model`. Keep new model logic
   independent of React; pass inputs explicitly so it can be tested directly.
4. Add its route to the matching route group. For a new group, import it explicitly
   into `AppRoutes.jsx`.
5. Export only reusable cross-feature capabilities through `index.js`. If a cycle
   appears, move composition to `application` or extract a genuinely shared contract.
6. Update route expectations and behavioral tests, then run the checks and build.

## Infrastructure and contracts

`shared/api/client.js` owns origin selection, optional bearer-token attachment,
and explicitly authenticated 401 handling. It returns a `Response`; existing
callers remain responsible for parsing their endpoint-specific payloads. Billing,
subscription, article, and ticket adapters retain their existing error contracts.
Do not create a second fetch wrapper with subtly different authentication behavior.

`shared/media` retains signed event and venue media URLs, including path-token URLs.
Never reconstruct a protected media URL from a filename. Existing media regression
tests cover these rules and the renderer/normalizer entry points.

Global styles live in `application/styles/index.css`; the shadcn configuration
points at `shared/components/ui` and `shared/utils/classes.js`. Existing Horizons
plugins remain separate in `plugins` as development integration code. They are
outside the application lint/format scope.

## Scope and remaining work

This refactor preserves screen behavior and request contracts while establishing
ownership boundaries. It separates large screen collections and event panels,
but some event/group page controllers still coordinate many state transitions.
There are also pre-existing DOM enhancements and effect-dependency warnings in
those flows. Replacing those with focused hooks, reducers, and declarative UI
needs workflow-specific interaction coverage; relocating code does not prove
those behaviors correct.

The project remains JavaScript. A TypeScript migration, a query cache, and route
code splitting are separate decisions with their own migration and testing costs.
Do not introduce a second state or API framework solely to reorganize files.

Automated checks cover boundaries, route composition, session request behavior,
configuration, media, billing, ticket parsing, and the build. They do not exercise
a real browser, live checkout, the camera, external maps, or a running backend.
