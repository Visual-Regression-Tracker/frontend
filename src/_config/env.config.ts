export const API_URL = window._env_?.REACT_APP_API_URL;
export const VRT_VERSION = window._env_?.VRT_VERSION;

declare global {
  interface Window {
    _env_: {
      REACT_APP_API_URL: string;
      VRT_VERSION: string;
    };
  }
}
