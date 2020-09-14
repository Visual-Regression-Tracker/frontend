export const API_URL = window._env_?.REACT_APP_API_URL;

declare global {
  interface Window {
    _env_: {
      REACT_APP_API_URL: string;
    };
  }
}
