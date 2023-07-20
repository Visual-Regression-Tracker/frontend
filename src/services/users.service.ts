import { handleResponse, authHeader } from "../_helpers/service.helpers";
import { Role, User } from "../types/user";
import { API_URL } from "../_config/env.config";

const ENDPOINT_URL = "/users";
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

function setUserInLocalStorage(user: User) {
  // store user details and jwt token in local storage to keep user logged in between page refreshes
  localStorage.setItem("user", JSON.stringify(user));
}

function login(email: string, password: string): Promise<User> {
  const requestOptions = {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
    },
    body: JSON.stringify({ email, password }),
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
    body: JSON.stringify({ firstName, lastName, email, password }),
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
}: {
  firstName: string;
  lastName: string;
  email: string;
}): Promise<User> {
  const requestOptions = {
    method: "PUT",
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify({ firstName, lastName, email }),
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
    body: JSON.stringify({ password }),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/password`, requestOptions).then(
    handleResponse,
  );
}

function logout() {
  localStorage.removeItem("user");
}

async function getAll(): Promise<User[]> {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };

  const response = await fetch(`${API_URL}${ENDPOINT_URL}/all`, requestOptions);
  return handleResponse(response);
}

async function assignRole(id: string | number, role: Role): Promise<User> {
  const requestOptions = {
    method: "PATCH",
    headers: {
      ...DEFAULT_HEADERS,
      ...authHeader(),
    },
    body: JSON.stringify({ id, role }),
  };

  return fetch(`${API_URL}${ENDPOINT_URL}/assignRole`, requestOptions).then(
    handleResponse,
  );
}

async function remove(ids: (string | number)[]): Promise<boolean> {
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
};
