import {
  login,
  logout,
  regenerateApiKey,
  update,
  UserReducer,
} from "./user.context";
import { usersService } from "../services";
import { TEST_USER, GUEST_USER } from "../_test/test.data.helper";

type State = Parameters<typeof UserReducer>[0];

const loggedOut: State = { loggedIn: false, userList: [] };

describe("UserReducer", () => {
  it("rolesChanged sets the role of the listed users only", () => {
    const state = UserReducer(
      { ...loggedOut, userList: [TEST_USER, GUEST_USER] },
      {
        type: "rolesChanged",
        payload: { ids: [GUEST_USER.id], role: "editor" },
      },
    );

    expect(state.userList).toEqual([
      TEST_USER,
      { ...GUEST_USER, role: "editor" },
    ]);
  });

  it("removed drops the listed users", () => {
    const state = UserReducer(
      { ...loggedOut, userList: [TEST_USER, GUEST_USER] },
      { type: "removed", payload: [GUEST_USER.id] },
    );

    expect(state.userList).toEqual([TEST_USER]);
  });

  it("success logs the user in", () => {
    const state = UserReducer(loggedOut, {
      type: "success",
      payload: TEST_USER,
    });

    expect(state).toEqual({ loggedIn: true, user: TEST_USER, userList: [] });
  });

  it("apiKeyChanged sets the key of the logged in user only", () => {
    const state = UserReducer(
      { loggedIn: true, user: TEST_USER, userList: [GUEST_USER] },
      { type: "apiKeyChanged", payload: "NEW" },
    );

    expect(state.user).toEqual({ ...TEST_USER, apiKey: "NEW" });
    expect(state.userList).toEqual([GUEST_USER]);
  });

  it("apiKeyChanged leaves a logged out state alone", () => {
    expect(
      UserReducer(loggedOut, { type: "apiKeyChanged", payload: "NEW" }),
    ).toEqual(loggedOut);
  });

  it("success replaces the user who was logged in", () => {
    const state = UserReducer(
      { loggedIn: true, user: TEST_USER, userList: [] },
      { type: "success", payload: GUEST_USER },
    );

    expect(state.user).toEqual(GUEST_USER);
  });

  it("logout forgets the user but keeps the user list", () => {
    const state = UserReducer(
      { loggedIn: true, user: TEST_USER, userList: [GUEST_USER] },
      { type: "logout" },
    );

    expect(state).toEqual({
      loggedIn: false,
      user: undefined,
      userList: [GUEST_USER],
    });
  });

  it("getAll stores the user list and keeps the logged in user", () => {
    const state = UserReducer(
      { loggedIn: true, user: TEST_USER, userList: [] },
      { type: "getAll", payload: [TEST_USER, GUEST_USER] },
    );

    expect(state).toEqual({
      loggedIn: true,
      user: TEST_USER,
      userList: [TEST_USER, GUEST_USER],
    });
  });

  it("does not change the state for an unknown action", () => {
    expect(UserReducer(loggedOut, { type: "nope" } as never)).toBe(loggedOut);
  });
});

describe("user action creators", () => {
  describe("login", () => {
    it("logs in through the service, then dispatches success with the user", async () => {
      const dispatch = vi.fn();
      const serviceLogin = vi
        .spyOn(usersService, "login")
        .mockResolvedValue(TEST_USER);

      await login(dispatch, "a@b.c", "secret");

      expect(serviceLogin).toHaveBeenCalledWith("a@b.c", "secret");
      expect(dispatch).toHaveBeenCalledWith({
        type: "success",
        payload: TEST_USER,
      });
    });

    it("does not dispatch when the service fails", async () => {
      const dispatch = vi.fn();
      vi.spyOn(usersService, "login").mockRejectedValue("Wrong password");

      await expect(login(dispatch, "a@b.c", "bad")).rejects.toBe(
        "Wrong password",
      );

      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("sends only the profile fields, then dispatches success with the answer", async () => {
      const dispatch = vi.fn();
      const serviceUpdate = vi
        .spyOn(usersService, "update")
        .mockResolvedValue(TEST_USER);

      await update(dispatch, {
        firstName: "New",
        lastName: "Name",
        email: "new@b.c",
        // @ts-expect-error extra fields are not part of the accepted type
        role: "admin",
      });

      expect(serviceUpdate).toHaveBeenCalledWith({
        firstName: "New",
        lastName: "Name",
        email: "new@b.c",
      });
      expect(dispatch).toHaveBeenCalledWith({
        type: "success",
        payload: TEST_USER,
      });
    });
  });

  describe("regenerateApiKey", () => {
    it("dispatches apiKeyChanged with the new key", async () => {
      const dispatch = vi.fn();
      vi.spyOn(usersService, "newApiKey").mockResolvedValue("NEW");

      await regenerateApiKey(dispatch);

      expect(dispatch).toHaveBeenCalledWith({
        type: "apiKeyChanged",
        payload: "NEW",
      });
    });

    it("does not dispatch when the service fails", async () => {
      const dispatch = vi.fn();
      vi.spyOn(usersService, "newApiKey").mockRejectedValue("nope");

      await expect(regenerateApiKey(dispatch)).rejects.toBe("nope");
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("clears the stored user, remembers the explicit logout and dispatches logout", () => {
      const dispatch = vi.fn();
      const serviceLogout = vi
        .spyOn(usersService, "logout")
        .mockImplementation(() => undefined);
      const mark = vi
        .spyOn(usersService, "markOidcLoggedOut")
        .mockImplementation(() => undefined);

      logout(dispatch);

      expect(serviceLogout).toHaveBeenCalledTimes(1);
      expect(mark).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: "logout" });
    });
  });
});
