# Frontend app for [Visual Regression Tracker](https://github.com/Visual-Regression-Tracker/Visual-Regression-Tracker)

## Local setup

- clone repo
- `npm i`
- Update `.env`
- `npm run start`

The testing related `.spec.tsx` files are used with Playwright for browser tests, and the `.test.tsx` files with Jest for unit tests.

## Local OIDC (SSO)

The UI asks the backend (`GET /users/oidc/enabled`) whether OIDC is enabled and then replaces the local login form with the SSO login. No UI configuration is needed for that.

- `REACT_APP_OIDC_AUTO_REDIRECT=true` redirects straight to the identity provider instead of showing the "Login with SSO" button. The overlay enables it:

```sh
docker compose -f docker-compose.yml -f docker-compose.oidc.yml up
```

See the backend README for the local mock identity provider.


## Running Tests

### Unit Tests (Jest)

Run Jest unit tests:

```bash
npm run test
```

### Integration Tests (Playwright)

#### Local Testing

Run Playwright tests locally (builds the app and serves it with `vite preview` on port 4173):

```bash
npm run test:pw:local
```

## Local HTTPS config

- Generate keys [here](https://www.selfsignedcertificate.com/)
- place in folder `/secrets` named `ssl.cert` and `ssl.key`
