import { useEffect } from "react";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { dinov2Service, ollamaService } from "../../services";
import {
  DEFAULT_NOISE_ANALYSIS_CONFIG,
  DEFAULT_NOISE_ANALYSIS_CONFIG_JSON,
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
import { NoiseAnalysisConfig, ProjectDto } from "../../types";
import { ImageComparison, VlmConfig } from "../../types/imageComparison";
import { Button } from "@mui/material";
import { ValidatedForm } from "../ValidatedForm";
import { ProjectForm } from "./ProjectForm";

type User = ReturnType<typeof renderWithProviders>["user"];

const PROJECT: ProjectDto = {
  id: "project-1",
  name: "Web shop",
  mainBranchName: "main",
  autoApproveFeature: true,
  imageComparison: ImageComparison.pixelmatch,
  imageComparisonConfig: PIXELMATCH_DEFAULT_CONFIG,
  noiseAnalysisConfig: DEFAULT_NOISE_ANALYSIS_CONFIG_JSON,
  maxBuildAllowed: 100,
  maxBranchLifetime: 30,
  bulkApproveVariations: false,
  bulkApproveGroupBy: "customTags",
};

// the project pages' wrapper: BaseModal's validated form, with the edit state printed
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
      <ValidatedForm onSubmit={() => onSubmit(projectEditState)}>
        <ProjectForm />
        <Button type="submit" data-testid="submitButton">
          Save
        </Button>
      </ValidatedForm>
      <output data-testid="editState">
        {JSON.stringify(projectEditState)}
      </output>
    </>
  );
};

type Config = Record<string, unknown>;
const parseConfig = (json: string) => JSON.parse(json) as Config;

const editState = () =>
  JSON.parse(screen.getByTestId("editState").textContent ?? "{}") as ProjectDto;
const editConfig = () => parseConfig(editState().imageComparisonConfig);
const submitSpy = () => vi.fn<(project: ProjectDto) => void>();

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

// clearing first would leave NaN in the state and the input
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
      const onSubmit = submitSpy();
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
        const onSubmit = submitSpy();
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
      const onSubmit = submitSpy();
      const { user } = await renderForm(PROJECT, onSubmit);

      await replaceNumber(user, screen.getByLabelText(field), "0");
      await user.click(screen.getByTestId("submitButton"));

      expect(
        await screen.findByText("Enter greater than or equal to 1"),
      ).toBeVisible();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does not submit a new project without a name", async () => {
      const onSubmit = submitSpy();
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

    it.each(
      ALL_ENGINES.filter(([engine]) => engine !== ImageComparison.pixelmatch),
    )(
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
      ["above 1", "2", "Enter less than or equal to 1"],
      ["a decimal above 1", "1.5", "Enter less than or equal to 1"],
      ["below 0", "-1", "Enter greater than or equal to 0"],
    ])("does not submit a threshold %s", async (_label, value, message) => {
      const onSubmit = submitSpy();
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
      const onSubmit = submitSpy();
      const { user } = await renderForm(odiff, onSubmit);

      await replaceNumber(
        user,
        screen.getByLabelText(/^Pixel diff threshold/),
        "5",
      );
      await user.click(screen.getByTestId("submitButton"));

      expect(
        await screen.findByText("Enter less than or equal to 1"),
      ).toBeVisible();
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
        const onSubmit = submitSpy();
        const { user } = await renderForm(lookSame, onSubmit);

        await replaceNumber(user, screen.getByLabelText(label), "-1");
        await user.click(screen.getByTestId("submitButton"));

        expect(
          await screen.findByText("Enter greater than or equal to 0"),
        ).toBeVisible();
        expect(onSubmit).not.toHaveBeenCalled();
      },
    );
  });

  describe("post-analysis", () => {
    const BLUR_SWITCH = /^Blurred difference and change density/;
    const DINOV2_SWITCH = /^Asks the DINOv2 service about patches/;
    const noiseConfig = () =>
      JSON.parse(editState().noiseAnalysisConfig) as NoiseAnalysisConfig;
    const withNoiseConfig = (config: object): ProjectDto => ({
      ...PROJECT,
      noiseAnalysisConfig: JSON.stringify(config),
    });
    const serverHas = (configured: boolean, available = configured) =>
      vi
        .spyOn(dinov2Service, "getStatus")
        .mockResolvedValue({ configured, available });

    it("shows the stages with their texts and the saved thresholds", async () => {
      await renderForm(
        withNoiseConfig({
          blur: { enabled: true, amplitudeThreshold: 60, solidShareMax: 0.02 },
          dinov2: { enabled: false, distanceThreshold: 0.2 },
        }),
      );

      expect(
        screen.getByRole("heading", { name: "Post-analysis" }),
      ).toBeVisible();
      expect(
        screen.getByText(
          "Rendering-noise check — on request, marks unresolved runs that look like rendering noise. A hint, it never approves anything",
        ),
      ).toBeVisible();
      expect(screen.getByText("Stage 1 · Blur")).toBeVisible();
      expect(screen.getByText("Stage 2 · DINOv2 second look")).toBeVisible();
      expect(
        screen.getByLabelText(
          "Blurred difference and change density. Cheap, runs on this server. Catches 92 of 120 bugs on our benchmark with the default thresholds, 0 false alarms",
        ),
      ).toBeChecked();
      expect(
        screen.getByLabelText(
          "Asks the DINOv2 service about patches the blur calls noise. Catches faint icons and borders, 102 of 120 together",
        ),
      ).not.toBeChecked();
      expect(screen.getByLabelText(/^Amplitude threshold/)).toHaveValue(60);
      expect(screen.getByLabelText(/^Solid share, max/)).toHaveValue(0.02);
      expect(screen.getByLabelText(/^Distance threshold/)).toHaveValue(0.2);
      expect(
        screen.getByText("Noise on our benchmark stays below 51"),
      ).toBeVisible();
    });

    it.each([
      [
        "a project without the field",
        { ...PROJECT, noiseAnalysisConfig: undefined },
      ],
      ["an empty field", { ...PROJECT, noiseAnalysisConfig: "" }],
      ["an empty object", withNoiseConfig({})],
    ])("shows the defaults for %s", async (_name, project) => {
      await renderForm(project as ProjectDto);

      expect(screen.getByLabelText(BLUR_SWITCH)).toBeChecked();
      expect(screen.getByLabelText(DINOV2_SWITCH)).toBeChecked();
      expect(screen.getByLabelText(/^Amplitude threshold/)).toHaveValue(80);
      expect(screen.getByLabelText(/^Solid share, max/)).toHaveValue(0.01);
      expect(screen.getByLabelText(/^Distance threshold/)).toHaveValue(0.15);
    });

    it("fills the keys a saved config lacks from the defaults", async () => {
      const { user } = await renderForm(
        withNoiseConfig({ blur: { amplitudeThreshold: 60 } }),
      );

      expect(screen.getByLabelText(/^Amplitude threshold/)).toHaveValue(60);
      expect(screen.getByLabelText(/^Solid share, max/)).toHaveValue(0.01);

      await user.click(screen.getByLabelText(DINOV2_SWITCH));

      expect(noiseConfig()).toEqual({
        blur: { enabled: true, amplitudeThreshold: 60, solidShareMax: 0.01 },
        dinov2: { enabled: false, distanceThreshold: 0.15 },
      });
    });

    it("leaves the comparison config alone", async () => {
      const { user } = await renderForm();

      await user.click(screen.getByLabelText(BLUR_SWITCH));

      expect(editState().imageComparisonConfig).toBe(PIXELMATCH_DEFAULT_CONFIG);
    });

    it.each([
      [
        "blur.enabled",
        () => screen.getByLabelText(BLUR_SWITCH),
        undefined,
        {
          blur: { enabled: false, amplitudeThreshold: 80, solidShareMax: 0.01 },
          dinov2: { enabled: true, distanceThreshold: 0.15 },
        },
      ],
      [
        "blur.amplitudeThreshold",
        () => screen.getByLabelText(/^Amplitude threshold/),
        "55",
        {
          blur: { enabled: true, amplitudeThreshold: 55, solidShareMax: 0.01 },
          dinov2: { enabled: true, distanceThreshold: 0.15 },
        },
      ],
      [
        "blur.solidShareMax",
        () => screen.getByLabelText(/^Solid share, max/),
        "0.05",
        {
          blur: { enabled: true, amplitudeThreshold: 80, solidShareMax: 0.05 },
          dinov2: { enabled: true, distanceThreshold: 0.15 },
        },
      ],
      [
        "dinov2.enabled",
        () => screen.getByLabelText(DINOV2_SWITCH),
        undefined,
        {
          blur: { enabled: true, amplitudeThreshold: 80, solidShareMax: 0.01 },
          dinov2: { enabled: false, distanceThreshold: 0.15 },
        },
      ],
      [
        "dinov2.distanceThreshold",
        () => screen.getByLabelText(/^Distance threshold/),
        "0.3",
        {
          blur: { enabled: true, amplitudeThreshold: 80, solidShareMax: 0.01 },
          dinov2: { enabled: true, distanceThreshold: 0.3 },
        },
      ],
    ])("changes only %s", async (_key, field, typed, expected) => {
      const { user } = await renderForm();

      if (typed === undefined) {
        await user.click(field());
      } else {
        await replaceNumber(user, field(), typed);
      }

      expect(noiseConfig()).toEqual(expected);
    });

    it("accepts thresholds between the steps of the arrows", async () => {
      const onSubmit = submitSpy();
      const { user } = await renderForm(PROJECT, onSubmit);
      const amplitude = screen.getByLabelText(/^Amplitude threshold/);
      const distance = screen.getByLabelText(/^Distance threshold/);

      await replaceNumber(user, amplitude, "80.5");
      await replaceNumber(user, distance, "0.125");
      await user.click(screen.getByTestId("submitButton"));

      expect(amplitude).toHaveAttribute("step", "any");
      expect(distance).toHaveAttribute("step", "any");
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(
        JSON.parse(onSubmit.mock.calls[0][0].noiseAnalysisConfig),
      ).toMatchObject({
        blur: { amplitudeThreshold: 80.5 },
        dinov2: { distanceThreshold: 0.125 },
      });
    });

    it("keeps the saved keys that are not part of the form", async () => {
      const { user } = await renderForm(
        withNoiseConfig({ ...DEFAULT_NOISE_ANALYSIS_CONFIG, future: 1 }),
      );

      await user.click(screen.getByLabelText(BLUR_SWITCH));

      expect(JSON.parse(editState().noiseAnalysisConfig)).toMatchObject({
        future: 1,
      });
    });

    it("keeps the settings when the comparison library changes", async () => {
      const config = {
        blur: { enabled: false, amplitudeThreshold: 60, solidShareMax: 0.02 },
        dinov2: { enabled: true, distanceThreshold: 0.2 },
      };
      const { user } = await renderForm(withNoiseConfig(config));

      await switchEngine(user, ImageComparison.odiff);

      expect(noiseConfig()).toEqual(config);
    });

    it("turns the second stage off for the project when asked while the first is on", async () => {
      const onSubmit = submitSpy();
      const { user } = await renderForm(PROJECT, onSubmit);

      await user.click(screen.getByLabelText(DINOV2_SWITCH));
      await user.click(screen.getByTestId("submitButton"));

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0][0].noiseAnalysisConfig).toBe(
        JSON.stringify({
          blur: { enabled: true, amplitudeThreshold: 80, solidShareMax: 0.01 },
          dinov2: { enabled: false, distanceThreshold: 0.15 },
        }),
      );
    });

    describe("with stage 1 off", () => {
      const stageOneOff = withNoiseConfig({
        ...DEFAULT_NOISE_ANALYSIS_CONFIG,
        blur: { ...DEFAULT_NOISE_ANALYSIS_CONFIG.blur, enabled: false },
      });

      it("disables stage 2 and says it needs stage 1", async () => {
        await renderForm(stageOneOff);

        expect(screen.getByLabelText(DINOV2_SWITCH)).toBeDisabled();
        expect(screen.getByLabelText(DINOV2_SWITCH)).toBeChecked();
        expect(screen.getByText("Needs stage 1")).toBeVisible();
        expect(screen.getByLabelText(/^Distance threshold/)).toBeDisabled();
        expect(screen.getByLabelText(/^Amplitude threshold/)).toBeDisabled();
        expect(screen.getByLabelText(/^Solid share, max/)).toBeDisabled();
        expect(screen.getByLabelText(BLUR_SWITCH)).toBeEnabled();
      });

      it("enables stage 2 again once stage 1 is back on", async () => {
        const { user } = await renderForm(stageOneOff);

        await user.click(screen.getByLabelText(BLUR_SWITCH));

        expect(screen.getByLabelText(DINOV2_SWITCH)).toBeEnabled();
        expect(screen.queryByText("Needs stage 1")).toBeNull();
        expect(noiseConfig()).toEqual(DEFAULT_NOISE_ANALYSIS_CONFIG);
      });
    });

    it("has no hint about stage 1 while it is on", async () => {
      await renderForm();

      expect(screen.queryByText("Needs stage 1")).toBeNull();
      expect(screen.getByLabelText(DINOV2_SWITCH)).toBeEnabled();
    });

    it("disables the whole section with the VLM comparator", async () => {
      await renderForm({
        ...PROJECT,
        imageComparison: ImageComparison.vlm,
        imageComparisonConfig: VLM_DEFAULT_CONFIG,
      });

      expect(
        screen.getByText("Not available with the VLM comparator"),
      ).toBeVisible();
      for (const field of [
        screen.getByLabelText(BLUR_SWITCH),
        screen.getByLabelText(DINOV2_SWITCH),
        screen.getByLabelText(/^Amplitude threshold/),
        screen.getByLabelText(/^Solid share, max/),
        screen.getByLabelText(/^Distance threshold/),
      ]) {
        expect(field).toBeDisabled();
      }
    });

    it("does not mention the VLM comparator with the others", async () => {
      await renderForm();

      expect(
        screen.queryByText("Not available with the VLM comparator"),
      ).toBeNull();
    });

    it("enables the section again when the library changes from VLM", async () => {
      const { user } = await renderForm({
        ...PROJECT,
        imageComparison: ImageComparison.vlm,
        imageComparisonConfig: VLM_DEFAULT_CONFIG,
      });

      await switchEngine(user, ImageComparison.pixelmatch);

      expect(screen.getByLabelText(BLUR_SWITCH)).toBeEnabled();
    });

    it("says nothing about DINOv2 while the service is available", async () => {
      await renderForm();

      await waitFor(() => expect(dinov2Service.getStatus).toHaveBeenCalled());
      expect(screen.queryByText(/no DINOv2 service/)).toBeNull();
      expect(screen.queryByText(/not answering/)).toBeNull();
    });

    it("says so when the server has no DINOv2 service", async () => {
      serverHas(false);
      await renderForm();

      expect(
        await screen.findByText(
          "Not available: this server has no DINOv2 service (DINOV2_URL). Runs are judged by the blur stage alone.",
        ),
      ).toBeVisible();
    });

    it("disables the DINOv2 stage when the server has no DINOv2 service", async () => {
      serverHas(false);
      await renderForm(
        withNoiseConfig({
          blur: { enabled: true, amplitudeThreshold: 60, solidShareMax: 0.02 },
          dinov2: { enabled: true, distanceThreshold: 0.2 },
        }),
      );

      await waitFor(() =>
        expect(screen.getByLabelText(DINOV2_SWITCH)).toBeDisabled(),
      );
      expect(screen.getByLabelText(/^Distance threshold/)).toBeDisabled();
      expect(screen.getByLabelText(DINOV2_SWITCH)).toBeChecked();
      expect(screen.getByLabelText(/^Distance threshold/)).toHaveValue(0.2);
    });

    it("warns when the service is set up but not answering", async () => {
      serverHas(true, false);
      await renderForm();

      expect(
        await screen.findByText(
          "The DINOv2 service is not answering right now. Until it does, runs are judged by the blur stage alone.",
        ),
      ).toBeVisible();
    });

    it("says nothing when the server does not tell its DINOv2 status", async () => {
      vi.spyOn(dinov2Service, "getStatus").mockRejectedValue("Not Found");
      await renderForm();

      await waitFor(() => expect(dinov2Service.getStatus).toHaveBeenCalled());
      expect(screen.queryByText(/judged by the blur stage alone/)).toBeNull();
    });

    it.each([
      ["Amplitude threshold", "0", "Enter greater than 0"],
      ["Distance threshold", "0", "Enter greater than 0"],
      ["Solid share, max", "2", "Enter less than or equal to 1"],
    ])("does not save %s of %s", async (label, typed, message) => {
      const onSubmit = submitSpy();
      const { user } = await renderForm(PROJECT, onSubmit);

      await replaceNumber(
        user,
        screen.getByLabelText(new RegExp(label)),
        typed,
      );
      await user.click(screen.getByTestId("submitButton"));

      expect(await screen.findByText(message)).toBeVisible();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("vlm config", () => {
    const vlm: ProjectDto = {
      ...PROJECT,
      imageComparison: ImageComparison.vlm,
      imageComparisonConfig: VLM_DEFAULT_CONFIG,
    };
    const defaults = JSON.parse(VLM_DEFAULT_CONFIG) as VlmConfig;

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

      it.each([
        ["above 1", "1.5", "Enter less than or equal to 1"],
        ["below 0", "-0.5", "Enter greater than or equal to 0"],
      ])("does not submit a temperature %s", async (_label, value, message) => {
        const onSubmit = submitSpy();
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

        await replaceNumber(user, screen.getByLabelText(/^Temperature/), value);
        await user.click(screen.getByTestId("submitButton"));

        expect(await screen.findByText(message)).toBeVisible();
        expect(onSubmit).not.toHaveBeenCalled();
      });

      it("does not submit without a model", async () => {
        const onSubmit = submitSpy();
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
        const onSubmit = submitSpy();
        const { user } = await renderForm(vlm, onSubmit);
        await screen.findByRole("combobox", { name: /^Model/ });

        await user.click(screen.getByTestId("submitButton"));

        expect(onSubmit).not.toHaveBeenCalled();
      });

      // fireEvent.submit skips the browser's own required check on the select
      it("says a model is required when none is picked from the list", async () => {
        vi.spyOn(ollamaService, "listModels").mockResolvedValue([
          { name: "gemma3:12b" },
        ]);
        const onSubmit = submitSpy();
        await renderForm(vlm, onSubmit);
        await screen.findByRole("combobox", { name: /^Model/ });

        fireEvent.submit(screen.getByTestId("submitButton"));

        expect(await screen.findByText("Model is required")).toBeVisible();
        expect(onSubmit).not.toHaveBeenCalled();
      });

      it("does not submit without a prompt", async () => {
        const onSubmit = submitSpy();
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
        const onSubmit = submitSpy();
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
        const onSubmit = submitSpy();
        const { user } = await renderForm(vlm, onSubmit);
        await switchToGemini(user);

        await user.click(screen.getByTestId("submitButton"));

        expect(onSubmit).not.toHaveBeenCalled();
      });

      it("does not submit without a model", async () => {
        const onSubmit = submitSpy();
        const { user } = await renderForm(vlm, onSubmit);
        await switchToGemini(user);
        await user.type(screen.getByLabelText(/^Gemini API Key/), "secret-key");

        await user.clear(screen.getByLabelText(/^Gemini Model/));
        await user.click(screen.getByTestId("submitButton"));

        expect(onSubmit).not.toHaveBeenCalled();
      });

      it("submits a complete Gemini config", async () => {
        const onSubmit = submitSpy();
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

      describe("with a saved, masked api key", () => {
        const masked: ProjectDto = {
          ...vlm,
          imageComparisonConfig: JSON.stringify({
            provider: "gemini",
            model: "gemini-1.5-flash",
            apiKey: "••••abcd",
            prompt: "Saved prompt",
            temperature: 0.2,
            useThinking: true,
          }),
        };
        const HINT = "Leave as is to keep the saved key.";

        it("shows the hint and submits the masked key unchanged", async () => {
          const onSubmit = submitSpy();
          const { user } = await renderForm(masked, onSubmit);

          expect(screen.getByText(HINT)).toBeInTheDocument();

          await user.click(screen.getByTestId("submitButton"));

          await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
          expect(
            JSON.parse(onSubmit.mock.calls[0][0].imageComparisonConfig),
          ).toMatchObject({ apiKey: "••••abcd" });
        });

        it("submits a typed key instead of the masked one and drops the hint", async () => {
          const onSubmit = submitSpy();
          const { user } = await renderForm(masked, onSubmit);

          await user.clear(screen.getByLabelText(/^Gemini API Key/));
          await user.type(
            screen.getByLabelText(/^Gemini API Key/),
            "new-secret",
          );

          expect(screen.queryByText(HINT)).not.toBeInTheDocument();
          await user.click(screen.getByTestId("submitButton"));

          await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
          expect(
            JSON.parse(onSubmit.mock.calls[0][0].imageComparisonConfig),
          ).toMatchObject({ apiKey: "new-secret" });
        });
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

  // an emptied field goes out as null when no validator looks at it (NaN is not valid JSON)
  describe("number fields", () => {
    type NumberField = {
      name: string;
      initial: ProjectDto;
      label: string | RegExp;
      inRange: string;
      expected: number;
      sent: (project: ProjectDto) => unknown;
      emptied:
        { refusedWith: string } | { blockedByBrowser: true } | { sentAs: null };
    };

    const withConfig = (
      imageComparison: ImageComparison,
      config: Record<string, unknown>,
    ): ProjectDto => ({
      ...PROJECT,
      imageComparison,
      imageComparisonConfig: JSON.stringify(config),
    });
    const withDefaults = (
      base: string,
      extra: Record<string, unknown> = {},
    ): Config => ({ ...parseConfig(base), ...extra });
    const sentKey =
      (key: string) =>
      (project: ProjectDto): unknown =>
        parseConfig(project.imageComparisonConfig)[key];

    const numberFieldTests = (rows: NumberField[]) => {
      it.each(rows)("saves an in-range $name", async (row) => {
        const onSubmit = submitSpy();
        const { user } = await renderForm(row.initial, onSubmit);

        await replaceNumber(
          user,
          screen.getByLabelText(row.label),
          row.inRange,
        );
        await user.click(screen.getByTestId("submitButton"));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(row.sent(onSubmit.mock.calls[0][0])).toBe(row.expected);
      });

      it.each(rows)("pins what an emptied $name does on save", async (row) => {
        const onSubmit = submitSpy();
        const { user } = await renderForm(row.initial, onSubmit);
        const field = screen.getByLabelText(row.label);

        await user.clear(field);
        await user.click(screen.getByTestId("submitButton"));

        if ("sentAs" in row.emptied) {
          await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
          expect(row.sent(onSubmit.mock.calls[0][0])).toBeNull();
          return;
        }
        expect(field).toBeInvalid();
        if ("refusedWith" in row.emptied) {
          expect(
            await screen.findByText(row.emptied.refusedWith),
          ).toBeVisible();
        }
        expect(onSubmit).not.toHaveBeenCalled();
      });
    };

    describe("project settings", () => {
      numberFieldTests([
        {
          name: "number of builds to keep",
          initial: PROJECT,
          label: /^Number of builds/,
          inRange: "7",
          expected: 7,
          sent: (project) => project.maxBuildAllowed,
          emptied: { refusedWith: "Enter greater than or equal to 1" },
        },
        {
          name: "max branch lifetime",
          initial: PROJECT,
          label: /^Max branch lifetime/,
          inRange: "14",
          expected: 14,
          sent: (project) => project.maxBranchLifetime,
          emptied: { refusedWith: "Enter greater than or equal to 1" },
        },
      ]);
    });

    describe("library thresholds", () => {
      numberFieldTests([
        {
          name: "pixelmatch threshold",
          initial: withConfig(
            ImageComparison.pixelmatch,
            withDefaults(PIXELMATCH_DEFAULT_CONFIG),
          ),
          label: /^Pixel diff threshold/,
          inRange: "0.5",
          expected: 0.5,
          sent: sentKey("threshold"),
          emptied: { blockedByBrowser: true },
        },
        {
          name: "odiff threshold",
          initial: withConfig(
            ImageComparison.odiff,
            withDefaults(ODIFF_DEFAULT_CONFIG),
          ),
          label: /^Pixel diff threshold/,
          inRange: "0.3",
          expected: 0.3,
          sent: sentKey("threshold"),
          emptied: { blockedByBrowser: true },
        },
        {
          name: "looksame tolerance",
          initial: withConfig(
            ImageComparison.lookSame,
            withDefaults(LOOKSSAME_DEFAULT_CONFIG),
          ),
          label: "Tolerance",
          inRange: "4.5",
          expected: 4.5,
          sent: sentKey("tolerance"),
          emptied: { sentAs: null },
        },
        {
          name: "looksame antialiasing tolerance",
          initial: withConfig(
            ImageComparison.lookSame,
            withDefaults(LOOKSSAME_DEFAULT_CONFIG),
          ),
          label: "Antialiasing tolerance",
          inRange: "1.5",
          expected: 1.5,
          sent: sentKey("antialiasingTolerance"),
          emptied: { sentAs: null },
        },
      ]);
    });

    describe("vlm temperature", () => {
      numberFieldTests([
        {
          name: "temperature with Ollama",
          initial: withConfig(
            ImageComparison.vlm,
            withDefaults(VLM_DEFAULT_CONFIG, { model: "gemma3:12b" }),
          ),
          label: /^Temperature/,
          inRange: "0.7",
          expected: 0.7,
          sent: sentKey("temperature"),
          emptied: { blockedByBrowser: true },
        },
        {
          name: "temperature with Gemini",
          initial: withConfig(
            ImageComparison.vlm,
            withDefaults(VLM_DEFAULT_CONFIG, {
              provider: "gemini",
              model: "gemini-1.5-flash",
              apiKey: "saved-key",
            }),
          ),
          label: /^Temperature/,
          inRange: "0.7",
          expected: 0.7,
          sent: sentKey("temperature"),
          emptied: { blockedByBrowser: true },
        },
      ]);
    });
  });
});
