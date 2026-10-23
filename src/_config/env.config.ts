export const API_URL = window._env_?.REACT_APP_API_URL;
// Optional base URL for serving images directly from a static host (e.g. the
// nginx of the UI container). When unset, images are fetched through the API.
export const STATIC_URL = window._env_?.REACT_APP_STATIC_URL;
export const VRT_VERSION = window._env_?.VRT_VERSION;
// When the backend has OIDC enabled, the login page redirects straight to the
// SSO provider instead of showing the "Login with SSO" button.
export const OIDC_AUTO_REDIRECT =
  window._env_?.REACT_APP_OIDC_AUTO_REDIRECT === "true";

declare global {
  interface Window {
    _env_: {
      REACT_APP_API_URL: string;
      REACT_APP_STATIC_URL?: string;
      REACT_APP_OIDC_AUTO_REDIRECT?: string;
      VRT_VERSION: string;
    };
  }
}
