import React from "react";
import { screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { buildsService, testVariationService } from "../services";
import { TEST_BUILD_PASSED } from "../_test/test.data.helper";
import { TestVariationMergeForm } from "./TestVariationMergeForm";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => mockNavigate,
}));

const BRANCHES = ["develop", "feature-1", "main"];

type User = ReturnType<typeof renderWithProviders>["user"];

const pickFromBranch = async (user: User, branch: string) => {
  // the from-branch select is the first combobox, the "To branch"
  // autocomplete the second
  await user.click(screen.getAllByRole("combobox")[0]);
  await user.click(
    within(screen.getByRole("listbox")).getByRole("option", { name: branch }),
  );
};

describe("TestVariationMergeForm", () => {
  beforeEach(() => {
    // the merge build gets selected, which loads its details
    vi.spyOn(buildsService, "getDetails").mockResolvedValue(TEST_BUILD_PASSED);
  });

  it("merges the picked from-branch into the typed to-branch of the project", async () => {
    const merge = vi
      .spyOn(testVariationService, "merge")
      .mockResolvedValue({ ...TEST_BUILD_PASSED, id: "merge-build-id" });
    const { user } = renderWithProviders(
      <TestVariationMergeForm projectId="project-1" items={BRANCHES} />,
    );

    await pickFromBranch(user, "feature-1");
    await user.type(screen.getByLabelText(/To branch/), "main");
    await user.click(screen.getByRole("button", { name: "Merge" }));

    await waitFor(() =>
      expect(merge).toHaveBeenCalledWith("project-1", "feature-1", "main"),
    );
    expect(merge).toHaveBeenCalledTimes(1);
  });

  it("announces the merge build, opens it in the project and selects it", async () => {
    const getDetails = vi.spyOn(buildsService, "getDetails");
    vi.spyOn(testVariationService, "merge").mockResolvedValue({
      ...TEST_BUILD_PASSED,
      id: "merge-build-id",
    });
    const { user } = renderWithProviders(
      <TestVariationMergeForm projectId="project-1" items={BRANCHES} />,
    );

    await pickFromBranch(user, "feature-1");
    await user.type(screen.getByLabelText(/To branch/), "main");
    await user.click(screen.getByRole("button", { name: "Merge" }));

    expect(
      await screen.findByText("Merge started in build: merge-build-id"),
    ).toBeVisible();
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/project-1",
      search: "buildId=merge-build-id",
    });
    await waitFor(() =>
      expect(getDetails).toHaveBeenCalledWith("merge-build-id"),
    );
  });

  it("accepts a to-branch that is not among the branches", async () => {
    const merge = vi
      .spyOn(testVariationService, "merge")
      .mockResolvedValue(TEST_BUILD_PASSED);
    const { user } = renderWithProviders(
      <TestVariationMergeForm projectId="project-1" items={BRANCHES} />,
    );

    await pickFromBranch(user, "develop");
    await user.type(screen.getByLabelText(/To branch/), "brand-new-branch");
    await user.click(screen.getByRole("button", { name: "Merge" }));

    await waitFor(() =>
      expect(merge).toHaveBeenCalledWith(
        "project-1",
        "develop",
        "brand-new-branch",
      ),
    );
  });

  it("lists the branches to merge from", async () => {
    const { user } = renderWithProviders(
      <TestVariationMergeForm projectId="project-1" items={BRANCHES} />,
    );

    await user.click(screen.getAllByRole("combobox")[0]);

    const options = within(screen.getByRole("listbox"))
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toEqual(["From branch", ...BRANCHES]);
  });

  it("does not merge without a from-branch", async () => {
    const merge = vi.spyOn(testVariationService, "merge");
    const { user } = renderWithProviders(
      <TestVariationMergeForm projectId="project-1" items={BRANCHES} />,
    );

    await user.type(screen.getByLabelText(/To branch/), "main");
    await user.click(screen.getByRole("button", { name: "Merge" }));

    expect(merge).not.toHaveBeenCalled();
  });

  it("does not merge without a to-branch", async () => {
    const merge = vi.spyOn(testVariationService, "merge");
    const { user } = renderWithProviders(
      <TestVariationMergeForm projectId="project-1" items={BRANCHES} />,
    );

    await pickFromBranch(user, "develop");
    await user.click(screen.getByRole("button", { name: "Merge" }));

    expect(merge).not.toHaveBeenCalled();
  });

  it("shows the error and stays put when the merge fails", async () => {
    vi.spyOn(testVariationService, "merge").mockRejectedValue("Merge failed");
    const { user } = renderWithProviders(
      <TestVariationMergeForm projectId="project-1" items={BRANCHES} />,
    );

    await pickFromBranch(user, "develop");
    await user.type(screen.getByLabelText(/To branch/), "main");
    await user.click(screen.getByRole("button", { name: "Merge" }));

    expect(await screen.findByText("Merge failed")).toBeVisible();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
