# Contributing

Thanks for helping. The short version:

1. `nvm use` (Node 22), `npm ci`, copy `.env` and point `REACT_APP_API_URL` at a running [backend](https://github.com/Visual-Regression-Tracker/Visual-Regression-Tracker).
2. `npm start` for the dev server.
3. Read [AGENTS.md](AGENTS.md): project layout, conventions, how tests are organised, and what must not be renamed. It applies to people as much as to coding agents.
4. Before opening a PR run `npm run lint`, `npm run typecheck`, `npm test` and `npm run test:pw:docker`. The pre-commit hook formats staged files with Prettier.
5. Keep PRs to one topic and fill in the template. Visible changes need before/after screenshots.
