export const API_URL = window._env_?.REACT_APP_API_URL;
// Optional static host for images, e.g. the nginx of the UI container; unset, they go through the API
export const STATIC_URL = window._env_?.REACT_APP_STATIC_URL;
// With OIDC enabled the login page redirects straight to the SSO provider instead of showing the button
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
