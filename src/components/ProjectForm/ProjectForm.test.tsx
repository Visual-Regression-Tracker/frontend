import React, { useEffect } from "react";
import { screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { dinov2Service, ollamaService } from "../../services";
import {
  LOOKSSAME_DEFAULT_CONFIG,
  ODIFF_DEFAULT_CONFIG,
  PIXELMATCH_DEFAULT_CONFIG,
  VLM_DEFAULT_CONFIG,
} from "../../constants";
import {
  setProjectEditState,
  useProjectDispatch,
  useProjectState,
} from "../../contexts";
import { ProjectDto } from "../../types";
import { ImageComparison } from "../../types/imageComparison";
import { Button } from "@mui/material";
import { ValidatorForm } from "react-material-ui-form-validator";
import { ProjectForm } from "./ProjectForm";

type User = ReturnType<typeof renderWithProviders>["user"];

const PROJECT: ProjectDto = {
  id: "project-1",
  name: "Web shop",
  mainBranchName: "main",
  autoApproveFeature: true,
  imageComparison: ImageComparison.pixelmatch,
  imageComparisonConfig: PIXELMATCH_DEFAULT_CONFIG,
  maxBuildAllowed: 100,
  maxBranchLifetime: 30,
  bulkApproveVariations: false,
  bulkApproveGroupBy: "customTags",
};

// The form the way the project pages use it: inside the validator form of
// BaseModal, which submits what the edit state holds. The state is printed so the tests can read it back.
const Harness = ({
  initial,
  onSubmit,
}: {
  initial: ProjectDto | null;
  onSubmit: (project: ProjectDto) => void;
}) => {
  const dispatch = useProjectDispatch();
  const { projectEditState } = useProjectState();

  useEffect(() => {
    if (initial) {
      setProjectEditState(dispatch, initial);
    }
  }, [dispatch, initial]);

  return (
    <>
      <ValidatorForm
        onSubmit={() => onSubmit(projectEditState)}
        instantValidate
      >
        <ProjectForm />
        <Button type="submit" data-testid="submitButton">
          Save
        </Button>
      </ValidatorForm>
      <output data-testid="editState">
        {JSON.stringify(projectEditState)}
      </output>
    </>
  );
};

const editState = (): ProjectDto =>
  JSON.parse(screen.getByTestId("editState").textContent ?? "{}");
const editConfig = () => JSON.parse(editState().imageComparisonConfig);

const renderForm = async (
  initial: ProjectDto | null = PROJECT,
  onSubmit: (project: ProjectDto) => void = vi.fn(),
) => {
  const rendered = renderWithProviders(
    <Harness initial={initial} onSubmit={onSubmit} />,
  );
  if (initial) {
    await waitFor(() => expect(editState().id).toBe(initial.id));
  }
  return rendered;
};

const choose = async (
  user: User,
  combobox: string | RegExp,
  option: string,
) => {
  await user.click(screen.getByRole("combobox", { name: combobox }));
  await user.click(
    within(screen.getByRole("listbox")).getByRole("option", { name: option }),
  );
};

const switchEngine = (user: User, engine: ImageComparison) =>
  choose(user, /Image comparison library/, engine);

// replaces the number the field holds; clearing it first would leave NaN in
// the state and in the input
const replaceNumber = async (user: User, field: HTMLElement, value: string) => {
  await user.type(field, value, {
    initialSelectionStart: 0,
    initialSelectionEnd: (field as HTMLInputElement).value.length,
  });
};

const ALL_ENGINES = [
  [ImageComparison.pixelmatch, PIXELMATCH_DEFAULT_CONFIG],
  [ImageComparison.lookSame, LOOKSSAME_DEFAULT_CONFIG],
  [ImageComparison.odiff, ODIFF_DEFAULT_CONFIG],
  [ImageComparison.vlm, VLM_DEFAULT_CONFIG],
] as const;

describe("ProjectForm", () => {
  beforeEach(() => {
    vi.spyOn(ollamaService, "listModels").mockResolvedValue([]);
    vi.spyOn(dinov2Service, "getStatus").mockResolvedValue({
      configured: true,
      available: true,
    });
  });

  describe("project settings", () => {
    it("shows the project being edited", async () => {
      await renderForm();

      expect(screen.getByLabelText(/^Project name/)).toHaveValue("Web shop");
      expect(screen.getByLabelText(/^Main branch/)).toHaveValue("main");
      expect(screen.getByLabelText(/^Number of builds to keep/)).toHaveValue(
        100,
      );
      expect(screen.getByLabelText(/^Max branch lifetime/)).toHaveValue(30);
      expect(screen.getByLabelText("Auto approve feature")).toBeChecked();
      expect(
        screen.getByLabelText("Bulk approve/reject variations"),
      ).not.toBeChecked();
      expect(
        screen.getByRole("combobox", { name: /Group variations by/ }),
      ).toHaveTextContent("customTags");
      expect(
        screen.getByRole("combobox", { name: /Image comparison library/ }),
      ).toHaveTextContent("pixelmatch");
    });

    it("starts empty with the defaults when creating a project", async () => {
      await renderForm(null);

      expect(screen.getByLabelText(/^Project name/)).toHaveValue("");
      expect(screen.getByLabelText(/^Main branch/)).toHaveValue("");
      expect(editState()).toMatchObject({
        id: "",
        name: "",
        mainBranchName: "",
        autoApproveFeature: true,
        imageComparison: "pixelmatch",
        imageComparisonConfig: PIXELMATCH_DEFAULT_CONFIG,
        maxBuildAllowed: 100,
        maxBranchLifetime: 30,
        bulkApproveVariations: false,
        bulkApproveGroupBy: "customTags",
      });
    });

    it("keeps the typed name and main branch in the edit state", async () => {
      const { user } = await renderForm();

      await user.clear(screen.getByLabelText(/^Project name/));
      await user.type(screen.getByLabelText(/^Project name/), "Mobile app");
      await user.clear(screen.getByLabelText(/^Main branch/));
      await user.type(screen.getByLabelText(/^Main branch/), "develop");

      expect(editState()).toMatchObject({
        name: "Mobile app",
        mainBranchName: "develop",
      });
    });

    it("keeps the typed build count and branch lifetime as numbers", async () => {
      const { user } = await renderForm();

      await replaceNumber(
        user,
        screen.getByLabelText(/^Number of builds/),
        "7",
      );
      await replaceNumber(
        user,
        screen.getByLabelText(/^Max branch lifetime/),
        "14",
      );

      expect(editState()).toMatchObject({
        maxBuildAllowed: 7,
        maxBranchLifetime: 14,
      });
    });

    it("switches auto approve and bulk approve on and off", async () => {
      const { user } = await renderForm();

      await user.click(screen.getByLabelText("Auto approve feature"));
      await user.click(screen.getByLabelText("Bulk approve/reject variations"));

      expect(editState()).toMatchObject({
        autoApproveFeature: false,
        bulkApproveVariations: true,
      });
      expect(screen.getByLabelText("Auto approve feature")).not.toBeChecked();
      expect(
        screen.getByLabelText("Bulk approve/reject variations"),
      ).toBeChecked();
    });

    it("groups variations by the axis chosen", async () => {
      const { user } = await renderForm();

      await choose(user, /Group variations by/, "viewport");

      expect(editState().bulkApproveGroupBy).toBe("viewport");
    });

    it("offers the five axes to group variations by", async () => {
      const { user } = await renderForm();

      await user.click(
        screen.getByRole("combobox", { name: /Group variations by/ }),
      );

      expect(
        within(screen.getByRole("listbox"))
          .getAllByRole("option")
          .map((option) => option.textContent),
      ).toEqual(["customTags", "os", "device", "viewport", "browser"]);
    });
  });

  describe("submitting", () => {
    it("submits the project as it was edited", async () => {
      const onSubmit = vi.fn();
      const { user } = await renderForm(PROJECT, onSubmit);

      await user.clear(screen.getByLabelText(/^Project name/));
      await user.type(screen.getByLabelText(/^Project name/), "Mobile app");
      await user.click(screen.getByTestId("submitButton"));

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit).toHaveBeenCalledWith({ ...PROJECT, name: "Mobile app" });
    });

    it.each([
      ["project name", /^Project name/],
      ["main branch", /^Main branch/],
    ])(
      "does not submit when the %s is a single character",
      async (_label, field) => {
        const onSubmit = vi.fn();
        const { user } = await renderForm(PROJECT, onSubmit);

        await user.clear(screen.getByLabelText(field));
        await user.type(screen.getByLabelText(field), "a");
        await user.click(screen.getByTestId("submitButton"));

        expect(
          await screen.findByText("Enter at least two characters."),
        ).toBeVisible();
        expect(onSubmit).not.toHaveBeenCalled();
      },
    );

    it.each([
      ["number of builds to keep", /^Number of builds/],
      ["max branch lifetime", /^Max branch lifetime/],
    ])("does not submit a zero for the %s", async (_label, field) => {
      const onSubmit = vi.fn();
      const { user } = await renderForm(PROJECT, onSubmit);

      await replaceNumber(user, screen.getByLabelText(field), "0");
      await user.click(screen.getByTestId("submitButton"));

      expect(await screen.findByText("Enter greater than 1")).toBeVisible();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does not submit a new project without a name", async () => {
      const onSubmit = vi.fn();
      const { user } = await renderForm(null, onSubmit);

      await user.click(screen.getByTestId("submitButton"));

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("image comparison library", () => {
    it("offers the four libraries", async () => {
      const { user } = await renderForm();

      await user.click(
        screen.getByRole("combobox", { name: /Image comparison library/ }),
      );

      expect(
        within(screen.getByRole("listbox"))
          .getAllByRole("option")
          .map((option) => option.textContent),
      ).toEqual(["pixelmatch", "lookSame", "odiff", "vlm"]);
    });

    it.each(ALL_ENGINES.filter(([engine]) => engine !== "pixelmatch"))(
      "starts %s from its default config when switching to it",
      async (engine, defaultConfig) => {
        const { user } = await renderForm();

        await switchEngine(user, engine);

        expect(editState().imageComparison).toBe(engine);
        expect(editState().imageComparisonConfig).toBe(defaultConfig);
      },
    );

    it("shows only the config form of the chosen library", async () => {
      const { user } = await renderForm();
      expect(screen.getByLabelText(/^Pixel diff threshold/)).toBeVisible();
      expect(
        screen.getByLabelText("Allow diff dimensions"),
      ).toBeInTheDocument();

      await switchEngine(user, ImageComparison.odiff);
      expect(screen.getByLabelText("Output diff mask")).toBeInTheDocument();
      expect(screen.queryByLabelText("Allow diff dimensions")).toBeNull();

      await switchEngine(user, ImageComparison.lookSame);
      expect(screen.getByLabelText("Strict")).toBeInTheDocument();
      expect(screen.queryByLabelText("Output diff mask")).toBeNull();

      await switchEngine(user, ImageComparison.vlm);
      expect(screen.getByLabelText(/^Prompt/)).toBeVisible();
      expect(screen.queryByLabelText("Strict")).toBeNull();

      await switchEngine(user, ImageComparison.pixelmatch);
      expect(screen.getByLabelText(/^Pixel diff threshold/)).toBeVisible();
      expect(screen.queryByLabelText(/^Prompt/)).toBeNull();
    });

    it("drops the edits of the library that was left", async () => {
      const { user } = await renderForm();
      await replaceNumber(
        user,
        screen.getByLabelText(/^Pixel diff threshold/),
        "0.5",
      );
      expect(editConfig().threshold).toBe(0.5);

      await switchEngine(user, ImageComparison.odiff);
      await switchEngine(user, ImageComparison.pixelmatch);

      expect(editState().imageComparisonConfig).toBe(PIXELMATCH_DEFAULT_CONFIG);
      expect(screen.getByLabelText(/^Pixel diff threshold/)).toHaveValue(0.1);
    });

    it("leaves the other project settings alone when switching", async () => {
      const { user } = await renderForm();

      await switchEngine(user, ImageComparison.odiff);

      expect(editState()).toMatchObject({
        id: PROJECT.id,
        name: PROJECT.name,
        mainBranchName: PROJECT.mainBranchName,
        maxBuildAllowed: PROJECT.maxBuildAllowed,
        maxBranchLifetime: PROJECT.maxBranchLifetime,
        autoApproveFeature: PROJECT.autoApproveFeature,
        bulkApproveVariations: PROJECT.bulkApproveVariations,
        bulkApproveGroupBy: PROJECT.bulkApproveGroupBy,
      });
    });

    it("shows the config form of a project saved with another library", async () => {
      await renderForm({
        ...PROJECT,
        imageComparison: ImageComparison.odiff,
        imageComparisonConfig: JSON.stringify({
          threshold: 0.25,
          antialiasing: false,
          failOnLayoutDiff: false,
          outputDiffMask: true,
        }),
      });

      expect(screen.getByLabelText(/^Pixel diff threshold/)).toHaveValue(0.25);
      expect(screen.getByLabelText("Ignore anti-alliasing")).not.toBeChecked();
      expect(screen.getByLabelText("Fail on layout diff")).not.toBeChecked();
      expect(screen.getByLabelText("Output diff mask")).toBeChecked();
    });
  });

  describe("pixelmatch config", () => {
    it("shows the config of the project", async () => {
      await renderForm();

      expect(screen.getByLabelText(/^Pixel diff threshold/)).toHaveValue(0.1);
      expect(screen.getByLabelText("Ignore anti-aliasing")).toBeChecked();
      expect(screen.getByLabelText("Allow diff dimensions")).not.toBeChecked();
    });

    it("writes the edits into the config json", async () => {
      const { user } = await renderForm();

      await user.click(screen.getByLabelText("Allow diff dimensions"));
      await user.click(screen.getByLabelText("Ignore anti-aliasing"));
      await replaceNumber(
        user,
        screen.getByLabelText(/^Pixel diff threshold/),
        "0.5",
      );

      expect(editConfig()).toEqual({
        threshold: 0.5,
        ignoreAntialiasing: false,
        allowDiffDimensions: true,
      });
    });

    it.each([
      ["above 1", "2", "Enter less than 1"],
      ["below 0", "-1", "Enter greater than 0"],
    ])("does not submit a threshold %s", async (_label, value, message) => {
      const onSubmit = vi.fn();
      const { user } = await renderForm(PROJECT, onSubmit);

      await replaceNumber(
        user,
        screen.getByLabelText(/^Pixel diff threshold/),
        value,
      );
      await user.click(screen.getByTestId("submitButton"));

      expect(await screen.findByText(message)).toBeVisible();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("odiff config", () => {
    const odiff: ProjectDto = {
      ...PROJECT,
      imageComparison: ImageComparison.odiff,
      imageComparisonConfig: ODIFF_DEFAULT_CONFIG,
    };

    it("shows the config of the project", async () => {
      await renderForm(odiff);

      expect(screen.getByLabelText("Output diff mask")).toBeChecked();
      expect(screen.getByLabelText("Fail on layout diff")).toBeChecked();
      expect(screen.getByLabelText("Ignore anti-alliasing")).toBeChecked();
      expect(screen.getByLabelText(/^Pixel diff threshold/)).toHaveValue(0);
    });

    it("writes the edits into the config json", async () => {
      const { user } = await renderForm(odiff);

      await user.click(screen.getByLabelText("Output diff mask"));
      await user.click(screen.getByLabelText("Fail on layout diff"));
      await user.click(screen.getByLabelText("Ignore anti-alliasing"));
      await replaceNumber(
        user,
        screen.getByLabelText(/^Pixel diff threshold/),
        "0.3",
      );

      expect(editConfig()).toEqual({
        threshold: 0.3,
        antialiasing: false,
        failOnLayoutDiff: false,
        outputDiffMask: false,
      });
    });

    it("does not submit a threshold above 1", async () => {
      const onSubmit = vi.fn();
      const { user } = await renderForm(odiff, onSubmit);

      await replaceNumber(
        user,
        screen.getByLabelText(/^Pixel diff threshold/),
        "5",
      );
      await user.click(screen.getByTestId("submitButton"));

      expect(await screen.findByText("Enter less than 1")).toBeVisible();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("lookSame config", () => {
    const lookSame: ProjectDto = {
      ...PROJECT,
      imageComparison: ImageComparison.lookSame,
      imageComparisonConfig: LOOKSSAME_DEFAULT_CONFIG,
    };

    it("shows the config of the project", async () => {
      await renderForm(lookSame);

      expect(screen.getByLabelText("Strict")).not.toBeChecked();
      expect(screen.getByLabelText("Tolerance")).toHaveValue(2.3);
      expect(screen.getByLabelText("Ignore anti-alliasing")).toBeChecked();
      expect(screen.getByLabelText("Antialiasing tolerance")).toHaveValue(0);
      expect(screen.getByLabelText("Ignore carret")).toBeChecked();
      expect(screen.getByLabelText("Allow diff dimensions")).not.toBeChecked();
    });

    it("writes the edits into the config json", async () => {
      const { user } = await renderForm(lookSame);

      await user.click(screen.getByLabelText("Strict"));
      await replaceNumber(user, screen.getByLabelText("Tolerance"), "4.5");
      await user.click(screen.getByLabelText("Ignore anti-alliasing"));
      await replaceNumber(
        user,
        screen.getByLabelText("Antialiasing tolerance"),
        "1.5",
      );
      await user.click(screen.getByLabelText("Ignore carret"));
      await user.click(screen.getByLabelText("Allow diff dimensions"));

      expect(editConfig()).toEqual({
        strict: true,
        tolerance: 4.5,
        ignoreAntialiasing: false,
        antialiasingTolerance: 1.5,
        ignoreCaret: false,
        allowDiffDimensions: true,
      });
    });

    it.each([["Tolerance"], ["Antialiasing tolerance"]])(
      "does not submit a negative %s",
      async (label) => {
        const onSubmit = vi.fn();
        const { user } = await renderForm(lookSame, onSubmit);

        await replaceNumber(user, screen.getByLabelText(label), "-1");
        await user.click(screen.getByTestId("submitButton"));

        expect(await screen.findByText("Enter greater than 0")).toBeVisible();
        expect(onSubmit).not.toHaveBeenCalled();
      },
    );
  });

  // switched on in each library's config; the backend applies it to all four
  describe("rendering-noise filter", () => {
    const noiseFilter = () => screen.getByLabelText("Ignore rendering noise");
    const noiseThreshold = () =>
      screen.queryByLabelText(/Rendering noise threshold/);

    it("is off by default and offers no threshold", async () => {
      await renderForm();

      expect(noiseFilter()).not.toBeChecked();
      expect(noiseThreshold()).not.toBeInTheDocument();
    });

    it.each(ALL_ENGINES)("is offered for %s", async (engine) => {
      const { user } = await renderForm();

      await switchEngine(user, engine);

      expect(noiseFilter()).toBeInTheDocument();
    });

    it("writes the switch and the threshold into the config json", async () => {
      const { user } = await renderForm();

      await user.click(noiseFilter());
      // the backend's default, until changed
      expect(noiseThreshold()).toHaveValue(80);
      await replaceNumber(user, noiseThreshold() as HTMLElement, "60.5");

      expect(editConfig()).toEqual({
        ...JSON.parse(PIXELMATCH_DEFAULT_CONFIG),
        blurAmplitudeFilter: true,
        blurAmplitudeThreshold: 60.5,
      });
    });

    it("shows the filter of a project saved with it on", async () => {
      await renderForm({
        ...PROJECT,
        imageComparisonConfig: JSON.stringify({
          ...JSON.parse(PIXELMATCH_DEFAULT_CONFIG),
          blurAmplitudeFilter: true,
          blurAmplitudeThreshold: 42,
        }),
      });

      expect(noiseFilter()).toBeChecked();
      expect(noiseThreshold()).toHaveValue(42);
    });

    it("does not submit a fraction above 128", async () => {
      const onSubmit = vi.fn();
      const { user } = await renderForm(PROJECT, onSubmit);

      await user.click(noiseFilter());
      await replaceNumber(user, noiseThreshold() as HTMLElement, "128.5");
      await user.click(screen.getByTestId("submitButton"));

      expect(await screen.findByText("Enter at most 128")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does not submit a threshold above 128", async () => {
      const onSubmit = vi.fn();
      const { user } = await renderForm(PROJECT, onSubmit);

      await user.click(noiseFilter());
      await replaceNumber(user, noiseThreshold() as HTMLElement, "129");
      await user.click(screen.getByTestId("submitButton"));

      expect(await screen.findByText("Enter at most 128")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    // the filter is not one of a library's own options: swapping in another
    // library's defaults must not switch it off
    it("keeps the filter when the library changes", async () => {
      const { user } = await renderForm();

      await user.click(noiseFilter());
      await replaceNumber(user, noiseThreshold() as HTMLElement, "50");
      await switchEngine(user, ImageComparison.odiff);

      expect(editConfig()).toEqual({
        ...JSON.parse(ODIFF_DEFAULT_CONFIG),
        blurAmplitudeFilter: true,
        blurAmplitudeThreshold: 50,
      });
    });

    it("keeps the filter when the VLM provider changes", async () => {
      const { user } = await renderForm({
        ...PROJECT,
        imageComparison: ImageComparison.vlm,
        imageComparisonConfig: JSON.stringify({
          ...JSON.parse(VLM_DEFAULT_CONFIG),
          blurAmplitudeFilter: true,
        }),
      });

      await choose(user, /VLM Provider/, "Google Gemini");

      expect(editConfig()).toMatchObject({
        provider: "gemini",
        blurAmplitudeFilter: true,
      });
    });
  });

  describe("DINOv2 check", () => {
    const dinov2Check = () => screen.getByLabelText("Check with DINOv2");
    const dinov2Threshold = () => screen.queryByLabelText(/DINOv2 threshold/);
    const withFilter = (config: object = {}): ProjectDto => ({
      ...PROJECT,
      imageComparisonConfig: JSON.stringify({
        ...JSON.parse(PIXELMATCH_DEFAULT_CONFIG),
        blurAmplitudeFilter: true,
        ...config,
      }),
    });
    const serverHas = (configured: boolean, available = configured) =>
      vi
        .spyOn(dinov2Service, "getStatus")
        .mockResolvedValue({ configured, available });

    it("is offered only while the noise filter is on", async () => {
      const { user } = await renderForm();

      expect(screen.queryByLabelText("Check with DINOv2")).toBeNull();
      await user.click(screen.getByLabelText("Ignore rendering noise"));

      expect(dinov2Check()).not.toBeChecked();
      expect(dinov2Threshold()).toBeNull();
    });

    it("writes the switch and the threshold into the config json", async () => {
      const { user } = await renderForm(withFilter());

      await waitFor(() => expect(dinov2Check()).toBeEnabled());
      await user.click(dinov2Check());
      // the backend's default, until changed
      expect(dinov2Threshold()).toHaveValue(0.15);
      await replaceNumber(user, dinov2Threshold() as HTMLElement, "0.2");

      expect(editConfig()).toEqual({
        ...JSON.parse(PIXELMATCH_DEFAULT_CONFIG),
        blurAmplitudeFilter: true,
        dinov2Check: true,
        dinov2Threshold: 0.2,
      });
    });

    it("shows the check of a project saved with it on", async () => {
      await renderForm(withFilter({ dinov2Check: true, dinov2Threshold: 0.3 }));

      expect(dinov2Check()).toBeChecked();
      expect(dinov2Threshold()).toHaveValue(0.3);
    });

    it("cannot be turned on where the server has no DINOv2 service", async () => {
      serverHas(false);
      await renderForm(withFilter());

      expect(
        await screen.findByText(
          "Not available: this server has no DINOv2 service (DINOV2_URL).",
        ),
      ).toBeVisible();
      expect(dinov2Check()).toBeDisabled();
    });

    // an older backend has no status endpoint, and no check either
    it("cannot be turned on when the server does not say", async () => {
      vi.spyOn(dinov2Service, "getStatus").mockRejectedValue("Not Found");
      await renderForm(withFilter());

      await waitFor(() => expect(dinov2Check()).toBeDisabled());
    });

    // with no service the backend sends every run the filter would pass to
    // review: say so, and let it be turned off
    it("lets a project saved with it on turn it off where there is no service", async () => {
      serverHas(false);
      const { user } = await renderForm(withFilter({ dinov2Check: true }));

      expect(
        await screen.findByText(
          /every run the filter would pass goes to review/,
        ),
      ).toBeVisible();
      await user.click(dinov2Check());

      expect(editConfig().dinov2Check).toBe(false);
      expect(dinov2Check()).toBeDisabled();
    });

    it("warns when the service is set up but not answering", async () => {
      serverHas(true, false);
      await renderForm(withFilter());

      expect(
        await screen.findByText(
          /The DINOv2 service is not answering right now/,
        ),
      ).toBeVisible();
      expect(dinov2Check()).toBeEnabled();
    });

    it("does not submit a threshold above 2", async () => {
      const onSubmit = vi.fn();
      const { user } = await renderForm(
        withFilter({ dinov2Check: true }),
        onSubmit,
      );

      await replaceNumber(user, dinov2Threshold() as HTMLElement, "2.5");
      await user.click(screen.getByTestId("submitButton"));

      expect(await screen.findByText("Enter at most 2")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("keeps the check when the library changes", async () => {
      const { user } = await renderForm(
        withFilter({ dinov2Check: true, dinov2Threshold: 0.25 }),
      );

      await switchEngine(user, ImageComparison.lookSame);

      expect(editConfig()).toEqual({
        ...JSON.parse(LOOKSSAME_DEFAULT_CONFIG),
        blurAmplitudeFilter: true,
        dinov2Check: true,
        dinov2Threshold: 0.25,
      });
    });
  });

  describe("vlm config", () => {
    const vlm: ProjectDto = {
      ...PROJECT,
      imageComparison: ImageComparison.vlm,
      imageComparisonConfig: VLM_DEFAULT_CONFIG,
    };
    const defaults = JSON.parse(VLM_DEFAULT_CONFIG);

    describe("with the Ollama provider", () => {
      it("starts on Ollama with the default prompt, temperature and thinking", async () => {
        await renderForm(vlm);

        expect(
          screen.getByRole("combobox", { name: /VLM Provider/ }),
        ).toHaveTextContent("Ollama");
        expect(screen.getByLabelText(/^Prompt/)).toHaveValue(defaults.prompt);
        expect(screen.getByLabelText(/^Temperature/)).toHaveValue(0.1);
        expect(screen.getByLabelText("Use Thinking")).not.toBeChecked();
        expect(screen.queryByLabelText(/Gemini/)).toBeNull();
      });

      it("lets the model be typed when Ollama lists none", async () => {
        const { user } = await renderForm(vlm);

        expect(
          await screen.findByText(
            "No models available. Enter model name manually.",
          ),
        ).toBeVisible();
        await user.type(screen.getByLabelText(/^Model/), "llava:13b");

        expect(editConfig().model).toBe("llava:13b");
      });

      it("lets the model be picked from the models Ollama lists", async () => {
        vi.spyOn(ollamaService, "listModels").mockResolvedValue([
          { name: "gemma3:12b" },
          { name: "llava:13b" },
        ]);
        const { user } = await renderForm(vlm);

        await choose(user, /^Model/, "llava:13b");

        expect(editConfig().model).toBe("llava:13b");
        expect(editState().imageComparison).toBe("vlm");
      });

      it("warns about a saved model Ollama does not list", async () => {
        vi.spyOn(ollamaService, "listModels").mockResolvedValue([
          { name: "gemma3:12b" },
        ]);
        await renderForm({
          ...vlm,
          imageComparisonConfig: JSON.stringify({
            ...defaults,
            model: "gone:1b",
          }),
        });

        expect(
          await screen.findByText(
            "Selected model is not in the available list.",
          ),
        ).toBeVisible();
      });

      it("does not warn about a listed model", async () => {
        vi.spyOn(ollamaService, "listModels").mockResolvedValue([
          { name: "gemma3:12b" },
        ]);
        await renderForm({
          ...vlm,
          imageComparisonConfig: JSON.stringify({
            ...defaults,
            model: "gemma3:12b",
          }),
        });

        await screen.findByRole("combobox", { name: /^Model/ });
        expect(
          screen.queryByText("Selected model is not in the available list."),
        ).toBeNull();
      });

      it("shows why the models are missing when Ollama cannot be asked", async () => {
        vi.spyOn(ollamaService, "listModels").mockRejectedValue(
          "Ollama is not reachable",
        );
        await renderForm(vlm);

        expect(
          await screen.findByText("Ollama is not reachable"),
        ).toBeVisible();
        expect(
          screen.getByText("No models available. Enter model name manually."),
        ).toBeVisible();
      });

      it("writes the prompt, temperature and thinking into the config json", async () => {
        const { user } = await renderForm(vlm);

        await user.clear(screen.getByLabelText(/^Prompt/));
        await user.type(screen.getByLabelText(/^Prompt/), "Compare");
        await replaceNumber(user, screen.getByLabelText(/^Temperature/), "0.7");
        await user.click(screen.getByLabelText("Use Thinking"));

        expect(editConfig()).toEqual({
          ...defaults,
          prompt: "Compare",
          temperature: 0.7,
          useThinking: true,
        });
      });

      it("does not submit without a model", async () => {
        const onSubmit = vi.fn();
        const { user } = await renderForm(vlm, onSubmit);
        await screen.findByText(
          "No models available. Enter model name manually.",
        );

        await user.click(screen.getByTestId("submitButton"));

        expect(onSubmit).not.toHaveBeenCalled();
      });

      it("does not submit without a model picked from the list", async () => {
        vi.spyOn(ollamaService, "listModels").mockResolvedValue([
          { name: "gemma3:12b" },
        ]);
        const onSubmit = vi.fn();
        const { user } = await renderForm(vlm, onSubmit);
        await screen.findByRole("combobox", { name: /^Model/ });

        await user.click(screen.getByTestId("submitButton"));

        expect(onSubmit).not.toHaveBeenCalled();
      });

      it("does not submit without a prompt", async () => {
        const onSubmit = vi.fn();
        const { user } = await renderForm(
          {
            ...vlm,
            imageComparisonConfig: JSON.stringify({
              ...defaults,
              model: "gemma3:12b",
            }),
          },
          onSubmit,
        );

        await user.clear(screen.getByLabelText(/^Prompt/));
        await user.click(screen.getByTestId("submitButton"));

        expect(onSubmit).not.toHaveBeenCalled();
      });

      it("submits a complete config", async () => {
        const onSubmit = vi.fn();
        const config = JSON.stringify({ ...defaults, model: "gemma3:12b" });
        const { user } = await renderForm(
          { ...vlm, imageComparisonConfig: config },
          onSubmit,
        );

        await user.click(screen.getByTestId("submitButton"));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0].imageComparisonConfig).toBe(config);
      });
    });

    describe("with the Gemini provider", () => {
      const switchToGemini = async (user: User) => {
        await choose(user, /VLM Provider/, "Google Gemini");
      };

      it("switches to Gemini with its default model and an empty key", async () => {
        const { user } = await renderForm(vlm);

        await switchToGemini(user);

        expect(editConfig()).toEqual({
          provider: "gemini",
          model: "gemini-1.5-pro",
          apiKey: "",
          prompt: defaults.prompt,
          temperature: defaults.temperature,
          useThinking: defaults.useThinking,
        });
        expect(screen.getByLabelText(/^Gemini Model/)).toHaveValue(
          "gemini-1.5-pro",
        );
        expect(screen.getByLabelText(/^Gemini API Key/)).toHaveValue("");
        expect(screen.queryByText(/No models available/)).toBeNull();
      });

      it("carries the prompt, temperature and thinking over to Gemini", async () => {
        const { user } = await renderForm(vlm);
        await user.clear(screen.getByLabelText(/^Prompt/));
        await user.type(screen.getByLabelText(/^Prompt/), "Compare");
        await replaceNumber(user, screen.getByLabelText(/^Temperature/), "0.4");
        await user.click(screen.getByLabelText("Use Thinking"));

        await switchToGemini(user);

        expect(editConfig()).toMatchObject({
          provider: "gemini",
          prompt: "Compare",
          temperature: 0.4,
          useThinking: true,
        });
        expect(screen.getByLabelText(/^Prompt/)).toHaveValue("Compare");
        expect(screen.getByLabelText("Use Thinking")).toBeChecked();
      });

      it("writes the model, key, prompt, temperature and thinking into the config json", async () => {
        const { user } = await renderForm(vlm);
        await switchToGemini(user);

        await user.clear(screen.getByLabelText(/^Gemini Model/));
        await user.type(
          screen.getByLabelText(/^Gemini Model/),
          "gemini-1.5-flash",
        );
        await user.type(screen.getByLabelText(/^Gemini API Key/), "secret-key");
        await user.clear(screen.getByLabelText(/^Prompt/));
        await user.type(screen.getByLabelText(/^Prompt/), "Compare");
        await replaceNumber(user, screen.getByLabelText(/^Temperature/), "0.9");
        await user.click(screen.getByLabelText("Use Thinking"));

        expect(editConfig()).toEqual({
          provider: "gemini",
          model: "gemini-1.5-flash",
          apiKey: "secret-key",
          prompt: "Compare",
          temperature: 0.9,
          useThinking: true,
        });
      });

      it("hides the typed api key", async () => {
        const { user } = await renderForm(vlm);
        await switchToGemini(user);

        expect(screen.getByLabelText(/^Gemini API Key/)).toHaveAttribute(
          "type",
          "password",
        );
      });

      it("does not submit without an api key", async () => {
        const onSubmit = vi.fn();
        const { user } = await renderForm(vlm, onSubmit);
        await switchToGemini(user);

        await user.click(screen.getByTestId("submitButton"));

        expect(onSubmit).not.toHaveBeenCalled();
      });

      it("does not submit without a model", async () => {
        const onSubmit = vi.fn();
        const { user } = await renderForm(vlm, onSubmit);
        await switchToGemini(user);
        await user.type(screen.getByLabelText(/^Gemini API Key/), "secret-key");

        await user.clear(screen.getByLabelText(/^Gemini Model/));
        await user.click(screen.getByTestId("submitButton"));

        expect(onSubmit).not.toHaveBeenCalled();
      });

      it("submits a complete Gemini config", async () => {
        const onSubmit = vi.fn();
        const { user } = await renderForm(vlm, onSubmit);
        await switchToGemini(user);
        await user.type(screen.getByLabelText(/^Gemini API Key/), "secret-key");

        await user.click(screen.getByTestId("submitButton"));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(
          JSON.parse(onSubmit.mock.calls[0][0].imageComparisonConfig),
        ).toEqual({
          provider: "gemini",
          model: "gemini-1.5-pro",
          apiKey: "secret-key",
          prompt: defaults.prompt,
          temperature: defaults.temperature,
          useThinking: defaults.useThinking,
        });
      });

      it("shows a saved Gemini config as Gemini", async () => {
        await renderForm({
          ...vlm,
          imageComparisonConfig: JSON.stringify({
            provider: "gemini",
            model: "gemini-1.5-flash",
            apiKey: "saved-key",
            prompt: "Saved prompt",
            temperature: 0.2,
            useThinking: true,
          }),
        });

        expect(
          screen.getByRole("combobox", { name: /VLM Provider/ }),
        ).toHaveTextContent("Google Gemini");
        expect(screen.getByLabelText(/^Gemini Model/)).toHaveValue(
          "gemini-1.5-flash",
        );
        expect(screen.getByLabelText(/^Gemini API Key/)).toHaveValue(
          "saved-key",
        );
        expect(screen.getByLabelText(/^Prompt/)).toHaveValue("Saved prompt");
        expect(screen.getByLabelText(/^Temperature/)).toHaveValue(0.2);
        expect(screen.getByLabelText("Use Thinking")).toBeChecked();
      });

      it("switches back to Ollama with an empty model, keeping the shared fields", async () => {
        const { user } = await renderForm(vlm);
        await switchToGemini(user);
        await user.type(screen.getByLabelText(/^Gemini API Key/), "secret-key");

        await choose(user, /VLM Provider/, "Ollama");

        expect(editConfig()).toEqual({
          provider: "ollama",
          model: "",
          prompt: defaults.prompt,
          temperature: defaults.temperature,
          useThinking: defaults.useThinking,
        });
        expect(screen.queryByLabelText(/Gemini/)).toBeNull();
      });
    });

    it("treats a saved config without a provider as Ollama", async () => {
      await renderForm({
        ...vlm,
        imageComparisonConfig: JSON.stringify({
          model: "llava:13b",
          prompt: "Saved prompt",
          temperature: 0.3,
        }),
      });

      expect(
        screen.getByRole("combobox", { name: /VLM Provider/ }),
      ).toHaveTextContent("Ollama");
      expect(screen.getByLabelText(/^Prompt/)).toHaveValue("Saved prompt");
    });
  });
});
