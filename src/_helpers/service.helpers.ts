import { routes } from "../constants";
import { usersService } from "../services";
import { User } from "../types";

export function authHeader() {
  // return authorization header with jwt token
  const userString = localStorage.getItem("user");

  if (userString) {
    const user: User = JSON.parse(userString);

    if (user?.token) {
      return {
        Authorization: "Bearer " + user.token,
      };
    }
  }

  return [];
}

export function handleResponse(response: Response) {
  return response.text().then((text: string) => {
    // the body is not always JSON: the proxy answers with an HTML page while
    // the API restarts, so a failed parse must not skip the status handling
    let data;
    let isJson = true;
    try {
      data = text && JSON.parse(text);
    } catch {
      isJson = false;
    }

    if (!response.ok || !isJson) {
      if (response.status === 401) {
        // auto logout if 401 response returned from api
        usersService.logout();
        // reload if not on login page
        if (window.location.pathname !== routes.LOGIN) {
          window.location.reload();
        }
      }

      // a successful status with a body that is not JSON is no answer either
      const error =
        data?.message ||
        (response.ok ? "Unexpected response from the server" : "") ||
        response.statusText;

      return Promise.reject(error);
    }

    return data;
  });
}
