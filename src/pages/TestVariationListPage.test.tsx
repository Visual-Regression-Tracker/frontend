import { screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { renderWithProviders } from "../_test/render";
import { TEST_PROJECT, TEST_USER } from "../_test/test.data.helper";
import { projectsService, testVariationService } from "../services";
import { TestVariation } from "../types";
import TestVariationListPage from "./TestVariationListPage";

type UserEvent = ReturnType<typeof renderWithProviders>["user"];

const variation = (id: string, overrides: Partial<TestVariation> = {}) => ({
  id,
  name: `Screen ${id}`,
  baselineName: `${id}.png`,
  branchName: "master",
  os: "Windows",
  browser: "chrome",
  viewport: "1920x1080",
  device: "Desktop",
  customTags: "smoke",
  ignoreAreas: "[]",
  projectId: TEST_PROJECT.id,
  baselines: [],
  ...overrides,
});

const LOGIN = variation("login", { name: "login" });
const CHECKOUT = variation("checkout", {
  name: "checkout",
  os: "macOS",
  device: "iPhone",
  browser: "safari",
  viewport: "375x812",
  customTags: "regression",
  branchName: "develop",
});
const LOGIN_MOBILE = variation("login-mobile", {
  name: "login mobile",
  device: "Pixel",
  browser: "firefox",
  viewport: "375x812",
});
const THREE = [LOGIN, CHECKOUT, LOGIN_MOBILE];

const many = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    variation(`v${String(i + 1).padStart(2, "0")}`),
  );

const mockProjects = () => {
  vi.spyOn(projectsService, "getAll").mockResolvedValue([TEST_PROJECT]);
  vi.spyOn(projectsService, "getFavorites").mockResolvedValue([]);
};

const renderRoute = (path: string, route: string) =>
  renderWithProviders(
    <Routes>
      <Route path={path} element={<TestVariationListPage />} />
    </Routes>,
    { user: TEST_USER, route },
  );

const renderPage = async (items: TestVariation[]) => {
  mockProjects();
  const getList = vi
    .spyOn(testVariationService, "getList")
    .mockResolvedValue(items);
  const result = renderRoute(
    "/variations/:projectId",
    `/variations/${TEST_PROJECT.id}`,
  );
  await screen.findByText(`${items.length} baselines`);
  return { ...result, getList };
};

const shownNames = () =>
  screen.queryAllByRole("heading", { level: 2 }).map((h) => h.textContent);

const pick = async (user: UserEvent, filter: string, option: string) => {
  const select = (await screen.findAllByRole("combobox")).find(
    (el) => el.id === `filter_${filter}`,
  );
  if (!select) throw new Error(`no ${filter} filter`);
  await user.click(select);
  await user.click(await screen.findByRole("option", { name: option }));
};

// MUI names the current page "page N" and the others "Go to page N"
const pageButton = (n: number) =>
  screen.getByRole("button", { name: new RegExp(`^(Go to )?page ${n}$`) });

describe("TestVariationListPage", () => {
  test("loads the variations of the project in the route", async () => {
    const { getList } = await renderPage(THREE);

    expect(getList).toHaveBeenCalledExactlyOnceWith(TEST_PROJECT.id);
    expect(shownNames()).toEqual(["login", "checkout", "login mobile"]);
  });

  test("shows a card per variation with its tags, branch and history link", async () => {
    await renderPage([CHECKOUT]);

    const card = screen
      .getByRole("heading", { name: "checkout" })
      .closest(".MuiCard-root") as HTMLElement;
    for (const tag of ["macOS", "iPhone", "safari", "375x812", "regression"]) {
      expect(within(card).getByText(tag)).toBeInTheDocument();
    }
    expect(within(card).getByText("develop")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "History" })).toHaveAttribute(
      "href",
      "/variations/details/checkout",
    );
  });

  test("tells that there are no variations", async () => {
    await renderPage([]);

    expect(screen.getByText("No variations")).toBeInTheDocument();
    expect(shownNames()).toEqual([]);
  });

  describe("filters", () => {
    test("by name", async () => {
      const { user } = await renderPage(THREE);

      await user.type(
        screen.getByRole("textbox", { name: "Name" }),
        "login{Enter}",
      );

      expect(await screen.findByText("2 of 3 baselines")).toBeInTheDocument();
      expect(shownNames()).toEqual(["login", "login mobile"]);
    });

    test.each([
      ["os", "macOS", ["checkout"]],
      ["device", "Pixel", ["login mobile"]],
      ["browser", "chrome", ["login"]],
      ["viewport", "375x812", ["checkout", "login mobile"]],
      ["customTags", "smoke", ["login", "login mobile"]],
      ["branchName", "develop", ["checkout"]],
    ])("by %s", async (filter, option, expected) => {
      const { user } = await renderPage(THREE);

      await pick(user, filter, option);

      expect(
        await screen.findByText(`${expected.length} of 3 baselines`),
      ).toBeInTheDocument();
      expect(shownNames()).toEqual(expected);
    });

    test("combined, a variation has to match all of them", async () => {
      const { user } = await renderPage(THREE);

      await pick(user, "os", "Windows");
      await pick(user, "viewport", "375x812");

      expect(shownNames()).toEqual(["login mobile"]);
      expect(screen.getByText("1 of 3 baselines")).toBeInTheDocument();
    });

    test("shows nothing when no variation matches", async () => {
      const { user } = await renderPage(THREE);

      await user.type(
        screen.getByRole("textbox", { name: "Name" }),
        "nope{Enter}",
      );

      expect(await screen.findByText("0 of 3 baselines")).toBeInTheDocument();
      expect(shownNames()).toEqual([]);
      expect(screen.getByText("No variations")).toBeInTheDocument();
    });

    test("Reset brings back the name and select filters", async () => {
      const { user } = await renderPage(THREE);
      await pick(user, "os", "macOS");
      await user.type(
        screen.getByRole("textbox", { name: "Name" }),
        "check{Enter}",
      );
      expect(shownNames()).toEqual(["checkout"]);

      await user.click(screen.getByRole("button", { name: "Reset" }));

      expect(await screen.findByText("3 baselines")).toBeInTheDocument();
      expect(shownNames()).toEqual(["login", "checkout", "login mobile"]);
      expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("");
    });

    test("Reset also clears the branch", async () => {
      const { user } = await renderPage(THREE);
      await pick(user, "branchName", "develop");
      expect(await screen.findByText("1 of 3 baselines")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Reset" }));

      expect(await screen.findByText("3 baselines")).toBeInTheDocument();
      expect(shownNames()).toEqual(["login", "checkout", "login mobile"]);
    });

    test("by name, ignoring case", async () => {
      const { user } = await renderPage([
        variation("login-page", { name: "Login page" }),
        CHECKOUT,
      ]);

      await user.type(
        screen.getByRole("textbox", { name: "Name" }),
        "login{Enter}",
      );

      expect(await screen.findByText("1 of 2 baselines")).toBeInTheDocument();
      expect(shownNames()).toEqual(["Login page"]);
    });
  });

  describe("pagination", () => {
    test("shows no pager while a page holds everything", async () => {
      await renderPage(many(12));

      expect(shownNames()).toHaveLength(12);
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Per page")).not.toBeInTheDocument();
    });

    test("pages through the list 12 at a time", async () => {
      const { user } = await renderPage(many(30));
      expect(shownNames()).toHaveLength(12);
      expect(shownNames()[0]).toBe("Screen v01");

      await user.click(pageButton(3));

      expect(shownNames()).toEqual([
        "Screen v25",
        "Screen v26",
        "Screen v27",
        "Screen v28",
        "Screen v29",
        "Screen v30",
      ]);
    });

    test("a bigger page size shows more and starts over at the first page", async () => {
      const { user } = await renderPage(many(30));
      await user.click(pageButton(2));
      expect(shownNames()[0]).toBe("Screen v13");

      await user.click(screen.getByRole("combobox", { name: "Per page" }));
      await user.click(await screen.findByRole("option", { name: "24" }));

      expect(shownNames()).toHaveLength(24);
      expect(shownNames()[0]).toBe("Screen v01");
      expect(pageButton(2)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Go to page 3" }),
      ).not.toBeInTheDocument();
    });

    test("a filter returns to the first page", async () => {
      const items = [
        ...many(24),
        variation("v25", { os: "macOS" }),
        variation("v26", { os: "macOS" }),
      ];
      const { user } = await renderPage(items);
      await user.click(pageButton(2));
      expect(shownNames()[0]).toBe("Screen v13");

      await pick(user, "os", "Windows");

      expect(await screen.findByText("24 of 26 baselines")).toBeInTheDocument();
      expect(shownNames()[0]).toBe("Screen v01");
      expect(pageButton(1)).toHaveAttribute("aria-current", "page");
    });

    test("falls back to the last page when deleting shrinks the list", async () => {
      vi.spyOn(testVariationService, "remove").mockImplementation((id) =>
        Promise.resolve(variation(id)),
      );
      const { user } = await renderPage(many(25));
      await user.click(pageButton(3));
      expect(shownNames()).toEqual(["Screen v25"]);

      await user.click(
        screen.getByRole("button", { name: "Delete variation" }),
      );
      await user.click(await screen.findByRole("button", { name: "Delete" }));

      expect(await screen.findByText("24 baselines")).toBeInTheDocument();
      expect(shownNames()).toHaveLength(12);
      expect(shownNames()[0]).toBe("Screen v13");
      expect(pageButton(2)).toHaveAttribute("aria-current", "page");
      expect(
        screen.queryByRole("button", { name: "Go to page 3" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("deleting", () => {
    const openDeleteOf = async (user: UserEvent, name: string) => {
      const card = screen
        .getByRole("heading", { name })
        .closest(".MuiCard-root") as HTMLElement;
      await user.click(
        within(card).getByRole("button", { name: "Delete variation" }),
      );
    };

    test("removes the variation and says so", async () => {
      const remove = vi
        .spyOn(testVariationService, "remove")
        .mockResolvedValue(CHECKOUT);
      const { user } = await renderPage(THREE);

      await openDeleteOf(user, "checkout");
      expect(
        screen.getByText("Are you sure you want to delete: checkout?"),
      ).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Delete" }));

      expect(await screen.findByText("checkout deleted")).toBeInTheDocument();
      expect(remove).toHaveBeenCalledExactlyOnceWith("checkout");
      expect(shownNames()).toEqual(["login", "login mobile"]);
      expect(screen.getByText("2 baselines")).toBeInTheDocument();
    });

    test("keeps the variation when the dialog is cancelled", async () => {
      const remove = vi.spyOn(testVariationService, "remove");
      const { user } = await renderPage(THREE);

      await openDeleteOf(user, "checkout");
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(remove).not.toHaveBeenCalled();
      expect(shownNames()).toHaveLength(3);
    });

    test("keeps the variation and shows the error when the delete fails", async () => {
      vi.spyOn(testVariationService, "remove").mockRejectedValue(
        "Cannot delete",
      );
      const { user } = await renderPage(THREE);

      await openDeleteOf(user, "checkout");
      await user.click(screen.getByRole("button", { name: "Delete" }));

      expect(await screen.findByText("Cannot delete")).toBeInTheDocument();
      expect(shownNames()).toHaveLength(3);
      expect(screen.queryByText("checkout deleted")).not.toBeInTheDocument();
    });
  });

  test("shows the error when the list cannot be loaded", async () => {
    mockProjects();
    vi.spyOn(testVariationService, "getList").mockRejectedValue(
      "Server is down",
    );

    renderRoute("/variations/:projectId", `/variations/${TEST_PROJECT.id}`);

    expect(await screen.findByText("Server is down")).toBeInTheDocument();
    expect(screen.getByText("0 baselines")).toBeInTheDocument();
  });

  test("loads nothing without a project in the route", async () => {
    mockProjects();
    const getList = vi.spyOn(testVariationService, "getList");

    renderRoute("/variations", "/variations");

    expect(
      await screen.findByRole("heading", { name: "Variations" }),
    ).toBeInTheDocument();
    expect(getList).not.toHaveBeenCalled();
  });
});
