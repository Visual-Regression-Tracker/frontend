# Testing cookbook

Patterns that already work in this repo. Copy from the example files instead of
inventing a new setup.

## Vitest (unit and component)

- **Render:** `renderWithProviders(ui, { route, user })` from
  `src/_test/render.tsx`. It returns `{ user }` (a `userEvent` instance) plus
  the usual render result. `route` sets the starting URL, e.g.
  `"/?buildId=b1&testId=t1"`; `user` seeds the logged-in user.
- **Mock services:** `vi.spyOn(testRunService, "getList").mockResolvedValue(...)`.
  Mocks are restored after every test (`restoreMocks: true`), so set them in
  `beforeEach` or in the test.
- **Fixtures:** `run({...})` from `src/_helpers/testRun.fixture.ts` for a test
  run (it names every grouping axis). Avoid `src/_test/test.data.helper.ts` for
  new tests: it does not type-check.
- **Tooltip-wrapped buttons:** the label sits on a span around the button; see
  `actionButton()` in `src/components/TestRunList/index.test.tsx`.
- **Fake timers with typing:** `vi.useFakeTimers({ shouldAdvanceTime: true })`
  and `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`. Example:
  `src/components/Filters.test.tsx`.
- **Async UI:** prefer `await screen.findBy…` over `waitFor(() => getBy…)`.
  Assert on what the user sees (text, role, label, test id) and on the exact
  service call (`toHaveBeenCalledWith`).
- **Snackbars:** toasts render into the document; find them by text with
  `findByText`.
- **Out-of-order answers:** create deferred promises
  (`let resolveA; const a = new Promise(r => (resolveA = r))`), return them from
  the mock, resolve B before A, then assert.
- **Data Grid:** renders in jsdom (see `TestRunList/index.test.tsx`); rows are
  `role="row"`, cells `role="gridcell"`.
- **Live updates:** `renderWithProviders(ui, { socket: createFakeSocket() })`
  mounts the real `SocketProvider` with a fake socket; `socket.emit(event, payload)`
  delivers an event inside `act`. Example: `src/pages/ProjectPage.test.tsx`.
- **Rendering `ProjectPage` or the details dialog:** Konva needs the native
  `canvas` module, so mock the drawing area:
  `vi.mock("../components/TestDetailsDialog/DrawArea", () => ({ DrawArea: () => null }))`
  (path relative to the test). `BuildList` calls `scrollTo`: stub
  `Element.prototype.scrollTo = vi.fn()` in `beforeEach`.
- **Observe navigation:** render a small probe next to the component that
  prints `useLocation().search` (see `BuildList/index.test.tsx`).
- **Module state:** `MatchingVariationsDialog` keeps a module-level set per
  build; use a different build id per test.
- **No snapshot tests.**

## Playwright (functional)

- Specs in `integration_tests/test/*.spec.ts`, page objects in
  `integration_tests/pages`, API mocks in `integration_tests/utils/mocks.ts`
  (`mockGetBuilds`, `mockGetTestRuns`, `mockTestRun`, `mockApproveTestRuns`,
  `mockApiError`, …), fixtures in `integration_tests/fixtures/index.ts`.
- **Port:** set `PW_PORT` to a free port between 4200 and 4999 when running
  Playwright (e.g. `PW_PORT=4311 npx playwright test ...`). The default 4173 is
  shared by every worktree, and Playwright reuses a server already listening
  there, so you could test another worktree's build.
- Run one spec locally without screenshots:
  `npx playwright test integration_tests/test/<name>.spec.ts --grep-invert renders`.
  First time: `npx playwright install chromium`.
- The app runs as a production bundle, where icons have no `data-testid`
  unless set explicitly (AGENTS.md).
- Table view selection count: `.MuiDataGrid-selectedRowCount` (the
  `gridSelectionCount` test id exists only in card view). Untick the Data
  Grid's header checkbox with `click()`, not `uncheck()` (its state settles
  late and `uncheck()` reports "did not change its state").
- `mockTestRunsWithDetails(page, buildId, runs)` mocks a run list and each
  run's details (added by T8).
- Socket.io cannot be mocked in Playwright here; live-update behaviour is
  tested in Vitest (fake socket from task T1) and, against the real
  backend, in the e2e smoke below.
- Screenshot baselines are made only in Docker (`npm run test:pw:docker:update`)
  and reviewed by a person. Agents do not commit baselines.

## E2E smoke (real backend)

`integration_tests/e2e/*.e2e.ts` drive the production build against the
backend stack, with no `page.route` mocks: log in as the seeded admin, approve
a run posted through the SDK API (`apiKey` header), see a posted run arrive
over the socket. Only `PW_E2E=1` runs them; CI does in `e2e.yml`, against the
backend's `master` (or the `backend_ref` of a manual run).

```sh
# in a checkout of the backend repo; its committed .env seeds the admin
docker compose up -d --build
# here, once the API answers on http://localhost:4200
PW_E2E=1 PW_PORT=4311 npx playwright test
# afterwards, in the backend checkout
docker compose down --volumes
```

The stack's container names are fixed, so only one runs per machine. Each
test creates its own project, so specs run in parallel on a used database.
Stop the stack before the mocked suite: requests a spec does not mock would
reach the real API on port 4200 and fail there.

## Performance

`integration_tests/perf/largeBuild.perf.ts` loads a build of 5,000 runs and
checks render counts and the time of one socket update; it runs only with
`PW_PERF=1 npx playwright test integration_tests/perf` (and in its own CI job).
