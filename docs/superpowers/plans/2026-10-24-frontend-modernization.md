# Frontend Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pin today's behaviour with tests, move the toolchain and UI libraries to current versions, give agents and contributors written rules, then restyle the app on MUI (option A) without losing any function.

**Architecture:** Behaviour is fixed first (unit, component and Playwright tests), so every later change runs against the same safety net. The library work removes the deprecated `@mui/styles` before lifting MUI to v7, because v7 drops it. The redesign lives in one theme module (`src/theme/`) plus small layout changes; `data-testid`s, roles and labels stay, so the functional e2e tests do not change, only the screenshot baselines are regenerated and reviewed.

**Tech Stack:** React 18, TypeScript 5.9, Vite 8, Vitest 5 + Testing Library 16, Playwright 1.64 (Docker for screenshots), MUI 7.3 + X Data Grid 8, ESLint 9 flat config.

**Spec:** conversation with the maintainer on 2026-10-24 (option A chosen: stay on MUI, own design system; tests first; no functional regressions; one merge request).

## Global Constraints

- No functional change. Every existing Playwright test except screenshot baselines must pass unchanged after each task. A changed functional test needs a written reason in the commit.
- Do not rename or remove `data-testid`, `aria-label`, roles or visible button texts that tests or the guided tour (`*.locators.ts`) use.
- React stays on 18 in this MR (react-konva 19 needs React ≥19.3, react-joyride 2 caps at 18); React 19 is a follow-up.
- MUI target: `@mui/material` / `@mui/icons-material` ^7.3, `@mui/x-data-grid` ^8.29. `@mui/styles` removed.
- Node: CI and `.nvmrc` on 22 (20 is EOL); `engines.node` `>=22`.
- Screenshot baselines are only regenerated in Docker (`npm run test:pw:docker:update`), never on macOS.
- Each task ends green on: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and the Playwright suite in Docker.

## Review Focus

1. Data Grid 8 selection model (`{ type, ids: Set }` instead of an id array) — bulk approve/reject/delete and "select all filtered across pages" must keep working; pinned by `testRunGrid.spec.ts` and the BulkOperation component test (Task 3).
2. Form validation after replacing styles and lifting `react-material-ui-form-validator` to v5 — invalid login/register/project/profile input must still be refused; pinned by component tests in Task 3 and existing e2e.
3. Dark mode contrast of status chips and the diff canvas background — unresolved/failed must stay distinguishable; pinned by a theme unit test (contrast ≥ 4.5 for chip text) in Task 7.
4. Konva drawing (ignore areas) after MUI/theme changes — draw, select, delete, save; pinned by a new e2e test in Task 4.
5. Session expiry / API errors still surface a toast and log out — existing `errors.spec.ts`; the `handleResponse` unit tests in Task 2 pin the 401 path.

---

### Task 0: Green baseline and working gates

**Files:** `.eslintrc.cjs`, `test-docker.sh`, `package.json`, `.nvmrc`, `.github/workflows/*.yml`, files with the 25 `tsc` errors (`src/_test/test.data.helper.ts`, `Filters.tsx`, `ProjectForm.tsx`, `ProjectSelect.tsx`, `RegisterForm.tsx`, `DrawArea.tsx`, `TestDetailsModal.tsx`, `TestVariationMergeForm.tsx`, `UserList/ActionButtons.tsx`, `user.context.tsx`).

- [ ] `.eslintrc.cjs`: `root: true` (a nested checkout picked up the parent's config and plugins).
- [ ] `test-docker.sh`: Linux `node_modules` in a named volume, `npm ci` instead of `npm install` (the old script overwrote the host's macOS binaries).
- [ ] Fix all `tsc --noEmit` errors with type-only changes (no runtime change). Rename script `typescheck` → `typecheck` (keep the old name as alias).
- [ ] husky 9 + `prepare` script + `.husky/pre-commit` running `lint-staged`; drop the dead husky-v4 block from `package.json`.
- [ ] CI `workflow.yml`: Node 22, `actions/*@v4`, steps `npm ci`, `lint`, `typecheck`, `test`, `build`. `playwright.yml`: actions v4.
- [ ] Verify all gates; commit `chore: green baseline (typecheck, lint, husky, CI gates)`.

### Task 1: Jest → Vitest

**Files:** delete `jest.config.ts`, `jest.transform-nothing.js`; create `vitest.config.ts` (or `test` block in `vite.config.ts`); modify `src/setupTests.ts`, `package.json`, `tsconfig.json` (`types: ["vite/client", "vitest/globals", "@testing-library/jest-dom"]`); create `src/_test/render.tsx`.

**Interfaces — Produces:** `renderWithProviders(ui, { route?: string, user?: User | null, theme? }) => RenderResult & { user: UserEvent }` in `src/_test/render.tsx` (wraps MemoryRouter, ThemeProvider, SnackbarProvider, UserProvider seeded through `localStorage`). All later component tests use it.

- [ ] Vitest 5 with `environment: "jsdom"`, `globals: true`, `setupFiles`, `include: ["src/**/*.test.{ts,tsx}"]`, coverage provider v8 over `src/**` excluding `types/`, `*.d.ts`, `_test/`.
- [ ] `@testing-library/react` 16, `@testing-library/user-event` 14, `@testing-library/dom` 10; port the 7 existing suites (replace `jest.fn` → `vi.fn`).
- [ ] Scripts: `test` = `vitest run`, `test:watch` = `vitest`, `test:coverage` = `vitest run --coverage`.
- [ ] Same 47 tests pass; commit `test: move unit tests from Jest to Vitest`.

### Task 2: Unit tests for services, helpers, reducers

**Files:** create `src/services/*.service.test.ts`, `src/_helpers/{service,format,ignoreArea,scale,route}.helpers.test.ts`, `src/contexts/*.context.test.tsx`.

- [ ] `service.helpers`: `handleResponse` returns JSON on 2xx, on 401 clears the stored user and reloads/logs out, rejects with the API `message` otherwise; `authHeader` with/without stored user.
- [ ] Each service: one test per exported function asserting URL, method, headers and body sent to a stubbed `fetch` (`vi.stubGlobal("fetch", …)`), including query encoding (`ciBuildId`, `aroundBuildId`).
- [ ] Context reducers (`build`, `testRun`, `project`, `user`, `help`): export the reducer functions (named export, no behaviour change) and test each action type.
- [ ] Remaining pure helpers: table-driven tests.
- [ ] Commit `test: cover services, helpers and context reducers`.

### Task 3: Component tests

**Files:** `*.test.tsx` next to: `LoginForm`, `RegisterForm`, `PasswordField`, `ProjectForm` (+ each `*ConfigForm`), `TestVariationMergeForm`, `Filters`, `TestRunList/TestRunFilters`, `TestRunList/BulkOperation`, `BuildList`, `UserList`, `Header`, `ProjectSelect`, `TestStatusChip`, `TestDetailsDialog/ApproveRejectButtons`, `CommentsPopper`.

- [ ] Each test drives the component through roles/labels with `renderWithProviders` and asserts what the user sees and which service function is called with which arguments (services mocked with `vi.mock`).
- [ ] Forms: valid submit calls the service with exact payload; invalid input shows the validator message and calls nothing (Review Focus 2).
- [ ] BulkOperation: approve/reject/delete/download call the right service with the selected ids (Review Focus 1).
- [ ] Coverage thresholds in `vitest.config.ts` set to the reached level rounded down (ratchet), enforced in CI.
- [ ] Commit `test: component tests for forms, lists and dialog controls`.

### Task 4: Playwright gaps

**Files:** `integration_tests/test/{projectForm,ignoreAreas,comments}.spec.ts`, page objects/mocks as needed.

- [ ] Project form: switching image comparison (pixelmatch, odiff, looksSame, VLM, Gemini, Ollama) shows that engine's fields and saves its config JSON.
- [ ] Ignore areas: draw a rectangle on the checkpoint, save → PUT with the area; delete it; apply ignore areas from baseline (Review Focus 4).
- [ ] Comments: open the comments popper, edit, save → request body.
- [ ] Commit `test(e2e): project form engines, ignore areas, comments`.

### Task 5: Libraries and toolchain

**Files:** the 15 files importing `@mui/styles`; `Filters.tsx`, `TestRunFilters.tsx`, `BuildList/index.tsx` (debounce); `TestRunList/*`, `UserList/*`, `testRun.context.tsx` (Data Grid); `.eslintrc.cjs` → `eslint.config.js`; `tsconfig.json`; `package.json`.

**Interfaces — Produces:** `useDebouncedValue<T>(value: T, delayMs: number): T` in `src/_helpers/useDebouncedValue.ts`.

- [ ] Replace every `makeStyles` with `sx`/`styled` (same CSS values), remove `@mui/styles`. Commit.
- [ ] Replace `react-debounce-input` with `TextField` + `useDebouncedValue` (same delay as today). Commit.
- [ ] MUI 5 → 7 (`Grid` → `Grid` v2 API, `*Props` slot renames, codemods `@mui/codemod v7.0.0/…`), form-validator 5. Commit.
- [ ] X Data Grid 6 → 8 (selection model, `valueGetter` signature, `slots`). Commit.
- [ ] ESLint 9 flat config (`typescript-eslint` 8, `react-hooks` 5+, `jsx-a11y`, `import-x`, prettier last); tsconfig `moduleResolution: "bundler"`, `jsx: "react-jsx"`; bump the remaining minor/patch deps; `Router.jsx` → `Router.tsx`. Commit.
- [ ] Code-split routes with `React.lazy` so the main chunk drops below 500 kB.

### Task 6: Rules for agents and contributors

**Files:** create `AGENTS.md`, `CLAUDE.md` (`@AGENTS.md`), `CONTRIBUTING.md`, `.github/pull_request_template.md`, `.claude/settings.json`; modify `eslint.config.js`, `README.md`.

- [ ] `AGENTS.md`: layout (pages → components → contexts → services → types), naming (`.test.tsx` Vitest next to the file, `.spec.ts` Playwright in `integration_tests/test`, page objects, `*.locators.ts`), commands, definition of done (gates from Global Constraints), screenshot rules, "do not break data-testid".
- [ ] ESLint guards: `no-restricted-imports` for `@mui/styles` and deep `@mui/*/internal`; `fetch` allowed only in `src/services/**`; `import-x/no-restricted-paths` so `services`/`types` never import from `components`/`pages`/`contexts`.
- [ ] `.claude/settings.json`: allow the project's npm scripts, a PostToolUse hook that runs prettier on edited files.
- [ ] Commit `docs: agent and contributor rules, enforced by lint`.

### Task 7: Redesign on MUI (option A)

**Files:** create `src/theme/{tokens.ts,theme.ts,ColorModeProvider.tsx,index.ts,theme.test.ts}`; modify `App.tsx`, `Header.tsx`, `LoginPage`/`RegisterPage` + forms, `ProjectListPage.tsx`, `ProjectPage.tsx`, `BuildList`, `TestStatusChip`, `BuildStatusChip`, `TestDetailsDialog/*` toolbar spacing, `index.css`, `index.html` (font).

**Interfaces — Produces:** `useColorMode(): { mode: "light" | "dark"; toggle(): void }`; `buildTheme(mode): Theme`.

- [ ] Tokens: brand colour from the VRT logo (teal/cyan) as primary, indigo as secondary; semantic status colours (new=info, ok/approved=success, unresolved=warning, failed=error, autoApproved=success outlined); Inter Variable font; radius 10; soft shadows; component overrides (Button no uppercase, Card outlined, Chip, AppBar, Dialog, DataGrid).
- [ ] Light/dark with toggle in the header, persisted in `localStorage` (`vrt-color-mode`), default from `prefers-color-scheme`. Playwright pins light via `colorScheme: "light"` so baselines stay deterministic.
- [ ] Header: white/blurred app bar with logo + "Visual Regression Tracker" wordmark, project-aware nav, avatar menu.
- [ ] Login/Register: split layout (brand panel + form card); link styled as MUI `Link`.
- [ ] Project list: responsive card grid with an "add project" card instead of the floating FAB (keep its `data-testid`/label on the new control).
- [ ] Project page: sidebar and toolbar spacing, chips by semantic palette, empty states.
- [ ] Theme test: status chip text/background contrast ≥ 4.5 in both modes (Review Focus 3).
- [ ] Regenerate screenshots in Docker, look at every changed PNG, commit `feat(ui): new MUI theme, dark mode, refreshed layouts`.

### Task 8: Final verification and MR

- [ ] Full gates + Docker Playwright; whole-branch review; PR description with before/after screenshots and the follow-ups (React 19, TanStack Query, react-hook-form, MSW).

---

## Revisions after review (supersede the tasks above where they differ)

Two independent reviews (dependency migration; tests and redesign regressions) checked the plan against the code and npm. Accepted changes:

**Global Constraints — locator contract.** Besides testids and labels, these must keep matching: `aria-label="add"` on the add-project control (no testid), `#projectlist-1` only on real project cards, card text `Name: <name>`, icons `EditIcon`/`DeleteIcon`/`ThumbUpIcon`/`CloudDownloadIcon` (testids come from the icon), `#loginform-1` on exactly one element per login branch, tour targets in `src/constants/help.ts` (`#select-project`, `#build-list`, `#build-details`, `#test-run-list`, `#select-branch`, `#reset-filter`), header menus stay `keepMounted` with items "Users"/"Projects"/"Profile", and MUI class selectors used by page objects: `.MuiCard-root`, `.MuiDataGrid-row`, `.MuiDataGrid-columnHeaderTitle`, `.MuiChip-label`, `.MuiFormControlLabel-root .MuiTypography-root`, `.notistack-MuiContent`, `.react-joyride__tooltip`. `testRunGrid.spec` compares computed text colour of grid and table — overrides must keep them equal.

**Task 0.** Done (`f847cd4`). Node 22 also in `Dockerfile` (moved to Task 1 commit).

**Task 1.** `@types/node` → ^22 (vitest 5 peer); `setupTests` imports `@testing-library/jest-dom/vitest`; `vi.mock`/`vi.mocked`; remove `jest`, `ts-jest`, `jest-environment-jsdom`, `@types/jest`, `@types/testing-library__jest-dom`, `jest.transform-nothing.js`; stub `window.matchMedia` in setup; `renderWithProviders` defaults to the light theme.

**Task 2.** Include `socketReducer`; reducers exported from their files (not the barrel); `handleResponse` test mocks `../services`.

**Task 3 additions.** Debounced inputs (Filters, TestRunFilters, BuildList search): notify after 300 ms only when length ≥ 2 or empty, flush on Enter and blur, re-sync when the value prop changes (reset). `SocketProvider` with a fake socket: `build_*` / `testRun_*` events update state. `LoginPage` `#token=` redirect handling. Coverage thresholds per glob, so new files (theme) do not drop the global number.

**Task 4 additions (ranked).** Hotkeys in the details dialog (`a` approve, `x` reject, `Escape` close, `d` diff); `MatchingVariationsDialog` from the approve split button; dialog toolbar zoom/fit and clear/apply ignore areas.

**Task 5 order (each commit installable and green, baselines regenerated in Docker and reviewed in the same commit when pixels move):**
1. `@mui/styles` → `sx`/`styled` (still MUI 5).
2. `react-debounce-input` → `DebouncedTextField` component (`src/components/DebouncedTextField.tsx`, props: `value`, `onChange(value)`, `debounceTimeout=300`, `minLength=2`, plus TextField props) keeping the four behaviours above.
3. X Data Grid 6 → 8 on MUI 5.18: selection `{ type, ids: Set }` (`TestRunList/index.tsx` rowSelectionModel + onRowSelectionModelChange, `UserList/ActionButtons.tsx` via `gridRowSelectionIdsSelector`), `valueGetter(value, row)`, `showToolbar` where `slots.toolbar` is used, smoke the `apiRef` uses (`setDensity`, `gridFilteredSortedRowIdsSelector`, `subscribeEvent`).
4. MUI 5 → 7 + `react-material-ui-form-validator` 5; `@mui/codemod v7.0.0/grid-props` (21 files) — mechanical only.
5. ESLint 9 flat config: `typescript-eslint` 8, `eslint-plugin-react-hooks` 5.2 (7.x adds compiler rules that fail on current code), `react`, `jsx-a11y`, prettier last; `ignores` instead of `--ignore-path`; no `import/*` resolution rules (tsc covers them). tsconfig `bundler`/`react-jsx`. `Router.jsx` → `.tsx`. Route-level `React.lazy`.

**Task 6.** Layers include `_helpers` and `constants`; only `fetch` is restricted to services (socket.io and `window.open` stay where they are); the existing `service.helpers` ↔ `services` cycle is documented, `no-cycle` not enabled.

**Task 7.** First replace the `App.tsx` 10%/90% height split with a flex column (header auto, content fills) and keep the geometry e2e green before any visual change. Bundled `@fontsource-variable/inter`, no CDN. Add one e2e with `colorScheme: "dark"` for the toggle and persistence of `vrt-color-mode`. The add-project card keeps `aria-label="add"`, is not a `Card` and has no `#projectlist-1`.
