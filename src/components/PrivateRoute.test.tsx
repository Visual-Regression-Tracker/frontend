import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { useUserState } from "../contexts";
import { routes } from "../constants";
import { User } from "../types";
import PrivateRoute from "./PrivateRoute";

vi.mock("../contexts", () => ({
  useUserState: vi.fn(),
}));

const userWithRole = (role: User["role"]): User => ({
  id: role,
  token: "test-token",
  apiKey: "SOME KEY SECRET",
  email: `${role}@email.com`,
  firstName: "First name",
  lastName: "Last name",
  role,
});

const TEST_USER = userWithRole("admin");
const EDITOR_USER = userWithRole("editor");
const GUEST_USER = userWithRole("guest");

const mockUserState = (loggedIn: boolean, user?: User) =>
  vi.mocked(useUserState).mockReturnValue({
    loggedIn,
    user,
    userList: [],
  });

const SecretPage = () => <div>secret page</div>;

const renderAt = (roles?: User["role"][]) =>
  render(
    <MemoryRouter initialEntries={[routes.USER_LIST_PAGE]}>
      <Routes>
        <Route path={routes.LOGIN} element={<div>login page</div>} />
        <Route
          path={routes.PROJECT_LIST_PAGE}
          element={<div>project list page</div>}
        />
        <Route
          path={routes.USER_LIST_PAGE}
          element={<PrivateRoute component={SecretPage} roles={roles} />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe("PrivateRoute", () => {
  test("redirects to login when not logged in", () => {
    mockUserState(false);
    const item = renderAt();
    expect(item.getByText("login page")).toBeInTheDocument();
  });

  test("remembers the full link for after login, query string and hash included", () => {
    mockUserState(false);
    const LoginPage = () => {
      const { state } = useLocation();
      return <div>back to {(state as { from: string }).from}</div>;
    };
    const item = render(
      <MemoryRouter
        initialEntries={[`${routes.USER_LIST_PAGE}?buildId=b1&testId=t1#top`]}
      >
        <Routes>
          <Route path={routes.LOGIN} element={<LoginPage />} />
          <Route
            path={routes.USER_LIST_PAGE}
            element={<PrivateRoute component={SecretPage} />}
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      item.getByText(
        `back to ${routes.USER_LIST_PAGE}?buildId=b1&testId=t1#top`,
      ),
    ).toBeInTheDocument();
  });

  test("redirects to login when not logged in even if roles are set", () => {
    mockUserState(false);
    const item = renderAt(["admin"]);
    expect(item.getByText("login page")).toBeInTheDocument();
  });

  test("renders component for any logged in user when no roles set", () => {
    mockUserState(true, GUEST_USER);
    const item = renderAt();
    expect(item.getByText("secret page")).toBeInTheDocument();
  });

  test("renders component when user has a required role", () => {
    mockUserState(true, TEST_USER);
    const item = renderAt(["admin"]);
    expect(item.getByText("secret page")).toBeInTheDocument();
  });

  test.each([
    ["editor", EDITOR_USER],
    ["guest", GUEST_USER],
  ])("redirects %s to project list when role is missing", (_, user) => {
    mockUserState(true, user);
    const item = renderAt(["admin"]);
    expect(item.getByText("project list page")).toBeInTheDocument();
    expect(item.queryByText("secret page")).not.toBeInTheDocument();
  });

  test("redirects to project list when logged in without user data", () => {
    mockUserState(true);
    const item = renderAt(["admin"]);
    expect(item.getByText("project list page")).toBeInTheDocument();
  });
});
