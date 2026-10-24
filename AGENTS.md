# Working on the VRT frontend

Rules for anyone changing this repo, people and coding agents alike. The
frontend of [Visual Regression Tracker](https://github.com/Visual-Regression-Tracker/Visual-Regression-Tracker):
React 18, TypeScript (strict), Vite, MUI 7 with MUI X Data Grid, Konva for
the image canvas, socket.io for live updates.

## Commands

| What                                                  | Command                                                   |
| ----------------------------------------------------- | --------------------------------------------------------- |
| Dev server (needs `.env`, API on `REACT_APP_API_URL`) | `npm start`                                               |
| Unit and component tests (Vitest)                     | `npm test`, `npm run test:watch`, `npm run test:coverage` |
| Lint / types                                          | `npm run lint`, `npm run typecheck`                       |
| Production build                                      | `npm run build`                                           |
| Playwright, functional, on your machine               | `npx playwright test --grep-invert renders`               |
| Playwright, everything incl. screenshots (Docker)     | `npm run test:pw:docker`                                  |
| Regenerate screenshot baselines (Docker only)         | `npm run test:pw:docker:update`                           |

## Definition of done

A change is ready when all of these pass: `npm run lint`, `npm run typecheck`,
`npm test`, `npm run build`, `npm run test:pw:docker`. CI runs the same.
Coverage thresholds in `vitest.config.ts` only go up: raise them when you add
tests, never lower them to get green.

## Layout

```
src/
  pages/        one file per route, composes components; routes in Router.tsx
  components/   UI; a folder when a component has parts (TestRunList/, TestDetailsDialog/)
  contexts/     React context + reducer per domain (user, project, build, testRun, socket, help)
  services/     the only place that talks HTTP (fetch); one file per API resource
  _helpers/     pure functions and small hooks, no JSX
  constants/    routes, guided-tour locators and steps, defaults
  theme/        MUI theme, design tokens, colour mode
  types/        API types, shared enums
  _test/        test fixtures and renderWithProviders
integration_tests/
  test/         Playwright specs (*.spec.ts) and their screenshot baselines
  pages/        page objects; specs use these, not raw selectors
  utils/mocks.ts  page.route mocks of the API
  fixtures/     Playwright fixtures (signed-in user, page openers)
```

Imports flow one way: `pages → components → contexts → services → types`.
`services`, `types`, `_helpers` and `constants` never import from
`components`, `pages` or `contexts`. Lint enforces it, along with `fetch`
outside `src/services`. The one known cycle, `_helpers/service.helpers` ↔
`services`, is old and documented; do not add new ones.

## Conventions

- Styling: the `sx` prop or `styled()` from `@mui/material/styles`, with
  values from the theme (`"primary.main"`, `theme.spacing`). No
  `@mui/styles`/`makeStyles`, no new global CSS, no hard-coded colours:
  add a token in `src/theme/tokens.ts` if one is missing.
- Status colours come from the theme (`statusColor` in `src/theme`), never a
  per-component palette, so light and dark stay consistent.
- Data: components call context actions or services; services return typed
  promises and go through `handleResponse`.
- Strings shown to users are English, sentence case.
- Keep files focused; split a component when it passes ~300 lines rather than
  growing it.

## Tests

- `Foo.tsx` → `Foo.test.tsx` next to it (Vitest + Testing Library). Render
  with `renderWithProviders` from `src/_test/render.tsx`, mock services with
  `vi.spyOn(service, "fn")`, query by role, label or test id, assert what the
  user sees and the exact service call. No snapshot tests.
- Playwright specs live in `integration_tests/test` and mock the API with
  helpers from `integration_tests/utils/mocks.ts`; nothing there talks to a
  real backend. Test names say what the user gets, in plain English.
- A behaviour change needs a test that would have failed before it. A bug
  fix starts with the failing test.

## Things that look free to change but are not

- `data-testid`s, `aria-label`s, element ids and visible button texts are
  used by page objects and by the guided tour (`src/constants/help.ts`,
  `*.locators.ts`). Renaming one means updating the page object and the tour
  in the same change.
- Page objects also match some stock MUI class names (`.MuiCard-root`,
  `.MuiDataGrid-row`, `.MuiChip-label`, `.notistack-MuiContent`); keep those
  elements as the same MUI components.
- Screenshot baselines are produced only in Docker (fonts differ on macOS).
  Never commit baselines made on your machine. When a change moves pixels on
  purpose, regenerate in Docker and look at every changed PNG before
  committing.
- `react-joyride` is capped at React 18 and `react-konva` 19 needs React 19,
  so React stays on 18 until both are migrated together.
