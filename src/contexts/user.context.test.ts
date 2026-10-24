import { login, logout, update, UserReducer } from "./user.context";
import { usersService } from "../services";
import { TEST_USER, GUEST_USER } from "../_test/test.data.helper";

type State = Parameters<typeof UserReducer>[0];

const loggedOut: State = { loggedIn: false, userList: [] };

describe("UserReducer", () => {
  it("success logs the user in", () => {
    const state = UserReducer(loggedOut, {
      type: "success",
      payload: TEST_USER,
    });

    expect(state).toEqual({ loggedIn: true, user: TEST_USER, userList: [] });
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
