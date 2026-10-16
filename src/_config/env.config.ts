export const API_URL = window._env_?.REACT_APP_API_URL;
// Optional base URL for serving images directly from a static host (e.g. the
// nginx of the UI container). When unset, images are fetched through the API.
export const STATIC_URL = window._env_?.REACT_APP_STATIC_URL;
export const VRT_VERSION = window._env_?.VRT_VERSION;
// When enabled, the login page offers SSO (OIDC) instead of the local form.
export const OIDC_ENABLED = window._env_?.REACT_APP_OIDC_ENABLED === "true";
// When enabled, the login page redirects straight to the SSO provider.
export const OIDC_AUTO_REDIRECT =
  window._env_?.REACT_APP_OIDC_AUTO_REDIRECT === "true";

declare global {
  interface Window {
    _env_: {
      REACT_APP_API_URL: string;
      REACT_APP_STATIC_URL?: string;
      REACT_APP_OIDC_ENABLED?: string;
      REACT_APP_OIDC_AUTO_REDIRECT?: string;
      VRT_VERSION: string;
    };
  }
}
