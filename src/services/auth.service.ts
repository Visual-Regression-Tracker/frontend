import { handleResponse } from "../_helpers/service.helpers";
import { User } from "../types/user";
import { API_URL } from "../_config/api.config";

export const authService = {
  login,
  logout,
};

function login(email: string, password: string): Promise<User> {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  };

  return fetch(`${API_URL}/auth/login`, requestOptions)
    .then(handleResponse)
    .then((user) => {
      // store user details and jwt token in local storage to keep user logged in between page refreshes
      localStorage.setItem("user", JSON.stringify(user));
      return user;
    });
}

function logout() {
  localStorage.removeItem("user");
}
