import { authHeader, handleResponse } from "./service.helpers";
import { usersService } from "../services";

vi.mock("../services", () => ({
  usersService: { logout: vi.fn() },
}));

describe("authHeader", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("sends the stored token as a bearer Authorization header", () => {
    localStorage.setItem("user", JSON.stringify({ token: "abc" }));

    expect(authHeader()).toEqual({ Authorization: "Bearer abc" });
  });

  // NOTE: the "no header" answer is an empty array rather than an empty object
  it("sends no headers when nobody is logged in", () => {
    expect(authHeader()).toEqual([]);
  });

  it("sends no headers when the stored user has no token", () => {
    localStorage.setItem("user", JSON.stringify({ email: "a@b.c" }));

    expect(authHeader()).toEqual([]);
  });

  it("sends no headers when the stored user is null", () => {
    localStorage.setItem("user", "null");

    expect(authHeader()).toEqual([]);
  });
});

describe("handleResponse", () => {
  const reload = vi.fn();

  const stubLocation = (pathname: string) =>
    vi.stubGlobal("location", { pathname, reload });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves with the parsed JSON of a successful response", async () => {
    const response = new Response(JSON.stringify({ id: "1" }), { status: 200 });

    await expect(handleResponse(response)).resolves.toEqual({ id: "1" });
  });

  it("resolves with the empty body of a successful response as it is", async () => {
    const response = new Response("", { status: 200 });

    await expect(handleResponse(response)).resolves.toBe("");
  });

  it("rejects with the message the API sent", async () => {
    const response = new Response(JSON.stringify({ message: "Nope" }), {
      status: 400,
    });

    await expect(handleResponse(response)).rejects.toBe("Nope");
    expect(usersService.logout).not.toHaveBeenCalled();
  });

  it("rejects with the status text when the API sent no message", async () => {
    const response = new Response("", {
      status: 500,
      statusText: "Server Error",
    });

    await expect(handleResponse(response)).rejects.toBe("Server Error");
  });

  it("logs out and reloads the page on a 401 away from the login page", async () => {
    stubLocation("/projects");
    const response = new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });

    await expect(handleResponse(response)).rejects.toBe("Unauthorized");

    expect(usersService.logout).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("logs out but does not reload on a 401 at the login page", async () => {
    stubLocation("/login");
    const response = new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });

    await expect(handleResponse(response)).rejects.toBe("Unauthorized");

    expect(usersService.logout).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();
  });
});
