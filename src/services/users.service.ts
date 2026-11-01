import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { Role, User } from "../types/user";
import { API_URL } from "../_config/env.config";

const ENDPOINT_URL = "/users";
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

function setUserInLocalStorage(user: User) {
  localStorage.setItem("user", JSON.stringify(user));
}

function login(email: string, password: string): Promise<User> {
  const requestOptions = {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
    },
    body: JSON.stringify({
      email,
      password,
    }),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/login`, requestOptions)
    .then(handleResponse)
    .then((user) => {
      setUserInLocalStorage(user);
      return user;
    });
}

function register(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): Promise<User> {
  const requestOptions = {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
    },
    body: JSON.stringify({
      firstName,
      lastName,
      email,
      password,
    }),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/register`, requestOptions)
    .then(handleResponse)
    .then((user) => {
      setUserInLocalStorage(user);
      return user;
    });
}

function update({
  firstName,
  lastName,
  email,
}: Pick<User, "firstName" | "lastName" | "email">): Promise<User> {
  const requestOptions = {
    method: "PUT",
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify({
      firstName,
      lastName,
      email,
    }),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}`, requestOptions)
    .then(handleResponse)
    .then((user) => {
      setUserInLocalStorage(user);
      return user;
    });
}

function changePassword(password: string): Promise<boolean> {
  const requestOptions = {
    method: "PUT",
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify({
      password,
    }),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/password`, requestOptions).then(
    handleResponse,
  );
}

function logout() {
  localStorage.removeItem("user");
}

// Cached per page; anything but a boolean answer means the fallback.
function cachedFlag(
  path: string,
  fallback: boolean,
  { retryOnError }: { retryOnError: boolean },
): () => Promise<boolean> {
  let cached: Promise<boolean> | undefined;
  return () => {
    cached ??= fetch(`${API_URL}${ENDPOINT_URL}${path}`)
      .then((response) => (response.ok ? response.json() : fallback))
      .then((enabled) => (typeof enabled === "boolean" ? enabled : fallback))
      .catch(() => {
        if (retryOnError) {
          cached = undefined;
        }
        return fallback;
      });
    return cached;
  };
}

// The backend decides; any failure shows the local login form.
const isOidcEnabled = cachedFlag("/oidc/enabled", false, {
  retryOnError: false,
});

// On unless the backend says false: an older backend keeps it open, and a failed request is no answer, so ask again next time.
const isRegistrationEnabled = cachedFlag("/registration/enabled", true, {
  retryOnError: true,
});

function getOidcLoginUrl(): string {
  return `${API_URL}${ENDPOINT_URL}/oidc/login`;
}

// Set on an explicit logout so the login page does not redirect straight back to the IdP, whose session is still alive
const OIDC_LOGGED_OUT_KEY = "oidcLoggedOut";

function markOidcLoggedOut() {
  sessionStorage.setItem(OIDC_LOGGED_OUT_KEY, "true");
}

function isOidcLoggedOut(): boolean {
  return sessionStorage.getItem(OIDC_LOGGED_OUT_KEY) === "true";
}

function startOidcLogin() {
  sessionStorage.removeItem(OIDC_LOGGED_OUT_KEY);
  window.location.href = getOidcLoginUrl();
}

function getMe(token: string): Promise<User> {
  const requestOptions = {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
    },
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/me`, requestOptions).then(
    handleResponse,
  );
}

function completeOidcLogin(token: string): Promise<User> {
  return getMe(token).then((user) => {
    // /me omits the token; add it back so the user matches the local login's shape.
    const userWithToken = { ...user, token };
    setUserInLocalStorage(userWithToken);
    return userWithToken;
  });
}

async function getAll(): Promise<User[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  const response = await fetch(`${API_URL}${ENDPOINT_URL}/all`, requestOptions);

  return handleResponse(response);
}

function assignRole(id: string | number, role: Role): Promise<User> {
  const requestOptions = {
    method: "PATCH",
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify({
      id,
      role,
    }),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/assignRole`, requestOptions).then(
    handleResponse,
  );
}

function remove(ids: string[] | number[]): Promise<boolean> {
  const requestOptions = {
    method: "DELETE",
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify(ids),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}`, requestOptions).then(
    handleResponse,
  );
}

export const usersService = {
  login,
  logout,
  register,
  update,
  changePassword,
  getAll,
  assignRole,
  remove,
  isOidcEnabled,
  isRegistrationEnabled,
  markOidcLoggedOut,
  isOidcLoggedOut,
  startOidcLogin,
  completeOidcLogin,
};
