import { routes } from "../constants";
import { usersService } from "../services";

function storedToken(): string | undefined {
  const userString = localStorage.getItem("user");
  if (!userString) return undefined;

  const user: unknown = JSON.parse(userString);
  if (
    typeof user === "object" &&
    user !== null &&
    "token" in user &&
    typeof user.token === "string"
  ) {
    return user.token;
  }
  return undefined;
}

export function authHeader(): Record<string, string> {
  const token = storedToken();
  return token ? { Authorization: "Bearer " + token } : {};
}

function messageOf(data: unknown): unknown {
  return typeof data === "object" && data !== null && "message" in data
    ? data.message
    : undefined;
}

export function handleResponse<T>(response: Response): Promise<T> {
  return response.text().then((text: string) => {
    // the proxy answers with an HTML page while the API restarts, so a failed parse must not skip status handling
    let data: unknown;
    let isJson = true;
    try {
      data = text && JSON.parse(text);
    } catch {
      isJson = false;
    }

    if (!response.ok || !isJson) {
      if (response.status === 401) {
        usersService.logout();
        if (window.location.pathname !== routes.LOGIN) {
          window.location.reload();
        }
      }

      // a successful status with a body that is not JSON is no answer either
      const error =
        messageOf(data) ||
        (response.ok ? "Unexpected response from the server" : "") ||
        response.statusText;

      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- callers show the reason itself as the snackbar message
      return Promise.reject(error);
    }

    return Promise.resolve(data as T);
  });
}
