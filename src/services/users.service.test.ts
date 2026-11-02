import { usersService } from "./users.service";
import { API, AUTH, stubFetch } from "../_test/fetch.helper";
import { TEST_USER } from "../_test/test.data.helper";
import { Role } from "../types/user";

vi.mock("../_config/env.config", () => ({ API_URL: "http://api.test" }));

const JSON_HEADERS = { "Content-Type": "application/json" };
const storedUser = () => JSON.parse(localStorage.getItem("user") ?? "null");

describe("usersService", () => {
  beforeEach(() => {
    localStorage.setItem("user", JSON.stringify({ token: "token-1" }));
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  describe("login", () => {
    it("posts the credentials without an Authorization header", async () => {
      const fetchMock = stubFetch(TEST_USER);

      await usersService.login("a@b.c", "secret");

      expect(fetchMock).toHaveBeenCalledWith(`${API}/users/login`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ email: "a@b.c", password: "secret" }),
      });
    });

    it("keeps the logged in user in local storage and answers it", async () => {
      stubFetch(TEST_USER);

      const result = await usersService.login("a@b.c", "secret");

      expect(result).toEqual(TEST_USER);
      expect(storedUser()).toEqual(TEST_USER);
    });

    it("rejects with the API message and keeps the stored user", async () => {
      stubFetch({ message: "Wrong password" }, { status: 400 });

      await expect(usersService.login("a@b.c", "bad")).rejects.toBe(
        "Wrong password",
      );
      expect(storedUser()).toEqual({ token: "token-1" });
    });
  });

  describe("register", () => {
    it("posts the new account without an Authorization header", async () => {
      const fetchMock = stubFetch(TEST_USER);

      await usersService.register("First", "Last", "a@b.c", "secret");

      expect(fetchMock).toHaveBeenCalledWith(`${API}/users/register`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          firstName: "First",
          lastName: "Last",
          email: "a@b.c",
          password: "secret",
        }),
      });
    });

    it("keeps the registered user in local storage and answers it", async () => {
      stubFetch(TEST_USER);

      const result = await usersService.register("F", "L", "a@b.c", "x");

      expect(result).toEqual(TEST_USER);
      expect(storedUser()).toEqual(TEST_USER);
    });
  });

  describe("update", () => {
    it("puts only the profile fields on the users route", async () => {
      const fetchMock = stubFetch(TEST_USER);

      await usersService.update({
        ...TEST_USER,
        firstName: "New",
        lastName: "Name",
        email: "new@b.c",
      });

      expect(fetchMock).toHaveBeenCalledWith(`${API}/users`, {
        method: "PUT",
        headers: { ...JSON_HEADERS, ...AUTH },
        body: JSON.stringify({
          firstName: "New",
          lastName: "Name",
          email: "new@b.c",
        }),
      });
    });

    it("replaces the stored user with the answer", async () => {
      stubFetch(TEST_USER);

      await usersService.update(TEST_USER);

      expect(storedUser()).toEqual(TEST_USER);
    });
  });

  it("changePassword puts the new password on the password route", async () => {
    const fetchMock = stubFetch(true);

    const result = await usersService.changePassword("new-secret");

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(`${API}/users/password`, {
      method: "PUT",
      headers: { ...JSON_HEADERS, ...AUTH },
      body: JSON.stringify({ password: "new-secret" }),
    });
  });

  it("logout removes the stored user", () => {
    usersService.logout();

    expect(localStorage.getItem("user")).toBeNull();
  });

  it("getAll fetches every user from the all route", async () => {
    const fetchMock = stubFetch([TEST_USER]);

    const result = await usersService.getAll();

    expect(result).toEqual([TEST_USER]);
    expect(fetchMock).toHaveBeenCalledWith(`${API}/users/all`, {
      method: "GET",
      headers: AUTH,
    });
  });

  it("assignRole patches the user id and role", async () => {
    const fetchMock = stubFetch(TEST_USER);

    await usersService.assignRole("u1", Role.editor);

    expect(fetchMock).toHaveBeenCalledWith(`${API}/users/assignRole`, {
      method: "PATCH",
      headers: { ...JSON_HEADERS, ...AUTH },
      body: JSON.stringify({ id: "u1", role: "Editor" }),
    });
  });

  it("remove deletes the users whose ids are in the body", async () => {
    const fetchMock = stubFetch(true);

    await usersService.remove(["u1", "u2"]);

    expect(fetchMock).toHaveBeenCalledWith(`${API}/users`, {
      method: "DELETE",
      headers: { ...JSON_HEADERS, ...AUTH },
      body: '["u1","u2"]',
    });
  });

  describe("completeOidcLogin", () => {
    it("asks /me with the given token rather than the stored one", async () => {
      const fetchMock = stubFetch(TEST_USER);

      await usersService.completeOidcLogin("other-token");

      expect(fetchMock).toHaveBeenCalledWith(`${API}/users/me`, {
        method: "GET",
        headers: { Authorization: "Bearer other-token" },
      });
    });

    it("stores the user /me answers with the token merged in", async () => {
      stubFetch({ id: "1", email: "sso@b.c" });

      const result = await usersService.completeOidcLogin("sso-token");

      expect(result).toEqual({ id: "1", email: "sso@b.c", token: "sso-token" });
      expect(storedUser()).toEqual(result);
    });

    it("rejects without touching the stored user when /me fails", async () => {
      stubFetch({ message: "Invalid token" }, { status: 400 });

      await expect(usersService.completeOidcLogin("bad")).rejects.toBe(
        "Invalid token",
      );
      expect(storedUser()).toEqual({ token: "token-1" });
    });
  });

  describe("single sign-on helpers", () => {
    it("remembers an explicit logout in the session", () => {
      expect(usersService.isOidcLoggedOut()).toBe(false);

      usersService.markOidcLoggedOut();

      expect(usersService.isOidcLoggedOut()).toBe(true);
      expect(sessionStorage.getItem("oidcLoggedOut")).toBe("true");
    });

    it("startOidcLogin forgets the explicit logout and redirects to the IdP", () => {
      const location = { href: "http://app.test/login" };
      vi.stubGlobal("location", location);
      usersService.markOidcLoggedOut();

      usersService.startOidcLogin();

      expect(usersService.isOidcLoggedOut()).toBe(false);
      expect(location.href).toBe(`${API}/users/oidc/login`);
    });
  });

  describe("isOidcEnabled", () => {
    // the answer is cached in a module variable, so each case needs a fresh module
    const freshService = async () => {
      vi.resetModules();
      return (await import("./users.service")).usersService;
    };

    it("asks the backend without any request options", async () => {
      const fetchMock = stubFetch(true);
      const service = await freshService();

      await expect(service.isOidcEnabled()).resolves.toBe(true);

      expect(fetchMock).toHaveBeenCalledWith(`${API}/users/oidc/enabled`);
    });

    it("answers false when the backend says false", async () => {
      stubFetch(false);
      const service = await freshService();

      await expect(service.isOidcEnabled()).resolves.toBe(false);
    });

    it("answers false for anything that is not exactly true", async () => {
      stubFetch("true");
      const service = await freshService();

      await expect(service.isOidcEnabled()).resolves.toBe(false);
    });

    it("answers false when the endpoint is missing", async () => {
      stubFetch({ message: "Not found" }, { status: 404 });
      const service = await freshService();

      await expect(service.isOidcEnabled()).resolves.toBe(false);
    });

    it("answers false when the request fails", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
      const service = await freshService();

      await expect(service.isOidcEnabled()).resolves.toBe(false);
    });

    it("asks again after a failed request instead of keeping its fallback", async () => {
      const fetchMock = vi
        .fn()
        .mockRejectedValueOnce(new Error("offline"))
        .mockResolvedValue(new Response(JSON.stringify(false)));
      vi.stubGlobal("fetch", fetchMock);
      const service = await freshService();

      await expect(service.isRegistrationEnabled()).resolves.toBe(true);
      await expect(service.isRegistrationEnabled()).resolves.toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("asks the backend once and caches the answer", async () => {
      const fetchMock = stubFetch(true);
      const service = await freshService();

      await service.isOidcEnabled();
      await service.isOidcEnabled();

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("isRegistrationEnabled", () => {
    // the answer is cached in a module variable, so each case needs a fresh module
    const freshService = async () => {
      vi.resetModules();
      return (await import("./users.service")).usersService;
    };

    it("asks the backend without any request options", async () => {
      const fetchMock = stubFetch(true);
      const service = await freshService();

      await expect(service.isRegistrationEnabled()).resolves.toBe(true);

      expect(fetchMock).toHaveBeenCalledWith(
        `${API}/users/registration/enabled`,
      );
    });

    it("answers false when the backend says registration is off", async () => {
      stubFetch(false);
      const service = await freshService();

      await expect(service.isRegistrationEnabled()).resolves.toBe(false);
    });

    it("answers true when the endpoint is missing", async () => {
      stubFetch({ message: "Not found" }, { status: 404 });
      const service = await freshService();

      await expect(service.isRegistrationEnabled()).resolves.toBe(true);
    });

    it("answers true when the request fails", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
      const service = await freshService();

      await expect(service.isRegistrationEnabled()).resolves.toBe(true);
    });

    it("asks the backend once and caches the answer", async () => {
      const fetchMock = stubFetch(false);
      const service = await freshService();

      await service.isRegistrationEnabled();
      await service.isRegistrationEnabled();

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
