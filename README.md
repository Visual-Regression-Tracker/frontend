# Frontend app for [Visual Regression Tracker](https://github.com/Visual-Regression-Tracker/Visual-Regression-Tracker)

[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=Visual-Regression-Tracker_frontend&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=Visual-Regression-Tracker_frontend)

## Local setup

- clone repo
- `npm i`
- Update `.env`
- `npm run start`

The testing related `.spec.tsx` files are used with Playwright for browser tests, and the `.test.tsx` files with Jest for unit tests.

## Local OIDC (SSO)

When the backend runs with OIDC enabled, layer the OIDC overlay so the UI offers SSO:

```sh
docker compose -f docker-compose.yml -f docker-compose.oidc.yml up
```

- `REACT_APP_OIDC_ENABLED=true` replaces the local login form with the SSO login.
- `REACT_APP_OIDC_AUTO_REDIRECT=true` redirects straight to the identity provider.

See the backend README for the local mock identity provider.


## Running Tests

### Unit Tests (Jest)

Run Jest unit tests:

```bash
npm run test
```

### Integration Tests (Playwright)

#### Local Testing

Run Playwright tests locally (requires local dev server):

```bash
npm run test:pw:local
```

## Local HTTPS config

- Generate keys [here](https://www.selfsignedcertificate.com/)
- place in folder `/secrets` named `ssl.cert` and `ssl.key`
