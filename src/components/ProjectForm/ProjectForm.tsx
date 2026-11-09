import { MenuItem, Select, SelectChangeEvent, Stack } from "@mui/material";
import { type ChangeEvent, useMemo } from "react";
import { ValidatedTextField } from "../ValidatedForm";
import { AT_LEAST_TWO_CHARACTERS } from "../../_helpers/validation";
import {
  useProjectState,
  useProjectDispatch,
  setProjectEditState,
} from "../../contexts";
import { ImageComparison } from "../../types/imageComparison";
import { LooksSameConfigForm } from "./LooksSameConfigForm";
import { OdiffConfigForm } from "./OdiffConfigForm";
import { PixelmatchConfigForm } from "./PixelmatchConfigForm";
import { PostAnalysisForm } from "./PostAnalysisForm";
import {
  FieldRow,
  fieldLabelId,
  SettingsSection,
  ToggleRow,
} from "./SettingsRow";
import { VlmConfigForm } from "./VlmConfigForm";
import { getDefaultConfig } from "./utils";
import { WholeNumberField } from "./WholeNumberField";
import { ELEMENT_ID } from "../../constants/locators";

export const SETTINGS_SECTIONS = [
  { id: "general", title: "General" },
  { id: "review", title: "Review" },
  { id: "comparison", title: "Comparison" },
  { id: "post-analysis", title: "Post-analysis" },
] as const;

const configFormFor = (imageComparison: ImageComparison) => {
  switch (imageComparison) {
    case ImageComparison.pixelmatch:
      return <PixelmatchConfigForm />;

    case ImageComparison.lookSame:
      return <LooksSameConfigForm />;

    case ImageComparison.odiff:
      return <OdiffConfigForm />;

    case ImageComparison.vlm:
      return <VlmConfigForm />;

    default:
      return null;
  }
};

export const ProjectForm = () => {
  const { projectEditState: project } = useProjectState();
  const projectDispatch = useProjectDispatch();

  const configForm = useMemo(
    () => configFormFor(project.imageComparison),
    [project.imageComparison],
  );

  const update = (patch: Partial<typeof project>) =>
    setProjectEditState(projectDispatch, { ...project, ...patch });

  return (
    <Stack spacing={2}>
      <SettingsSection id="general" title="General">
        <FieldRow
          id={ELEMENT_ID.name}
          title="Project name"
          width={320}
          required
        >
          <ValidatedTextField
            name="projectName"
            rules={AT_LEAST_TWO_CHARACTERS}
            id={ELEMENT_ID.name}
            size="small"
            type="text"
            fullWidth
            required
            value={project.name}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              update({ name: event.target.value })
            }
          />
        </FieldRow>
        <FieldRow
          id={ELEMENT_ID.branchName}
          title="Main branch"
          width={320}
          required
        >
          <ValidatedTextField
            name="mainBranchName"
            rules={AT_LEAST_TWO_CHARACTERS}
            id={ELEMENT_ID.branchName}
            size="small"
            type="text"
            fullWidth
            required
            value={project.mainBranchName}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              update({ mainBranchName: event.target.value })
            }
          />
        </FieldRow>
        <FieldRow id={ELEMENT_ID.buildCount} title="Builds to keep" required>
          <WholeNumberField
            name="buildCount"
            value={project.maxBuildAllowed}
            onChange={(maxBuildAllowed) => update({ maxBuildAllowed })}
          />
        </FieldRow>
        <FieldRow
          id={ELEMENT_ID.maxBranchLifetime}
          title="Max branch lifetime, days"
          required
        >
          <WholeNumberField
            name="maxBranchLifetime"
            value={project.maxBranchLifetime}
            onChange={(maxBranchLifetime) => update({ maxBranchLifetime })}
          />
        </FieldRow>
      </SettingsSection>

      <SettingsSection id="review" title="Review">
        <ToggleRow
          title="Auto approve"
          description="Approve a run automatically when it looks the same as an earlier or already-approved baseline of this screen."
          name="autoApproveFeature"
          checked={project.autoApproveFeature}
          onChange={(autoApproveFeature) => update({ autoApproveFeature })}
        />
        <ToggleRow
          title="Bulk approve/reject variations"
          description="Review and bulk approve or reject a screen's variations (e.g. all locales) in one dialog. Only variations with the same change are pre-selected; different ones are left for manual review."
          name="bulkApproveVariations"
          checked={project.bulkApproveVariations}
          onChange={(bulkApproveVariations) =>
            update({ bulkApproveVariations })
          }
        />
        <FieldRow
          id="bulkApproveGroupBySelect"
          title="Variation axis"
          description="Which test-variation axis differs within a group. Screens that match on everything except this axis are grouped in the test run list and reviewed together, e.g. customTags for per-locale screenshots. Used by Group by on the build page and by Approve variations."
        >
          <Select
            id="bulkApproveGroupBySelect"
            labelId={fieldLabelId("bulkApproveGroupBySelect")}
            SelectDisplayProps={{
              "aria-describedby": "bulkApproveGroupBySelect-description",
            }}
            size="small"
            fullWidth
            value={project.bulkApproveGroupBy}
            onChange={(event: SelectChangeEvent<string>) =>
              update({ bulkApproveGroupBy: event.target.value })
            }
          >
            <MenuItem value="customTags">customTags</MenuItem>
            <MenuItem value="os">os</MenuItem>
            <MenuItem value="device">device</MenuItem>
            <MenuItem value="viewport">viewport</MenuItem>
            <MenuItem value="browser">browser</MenuItem>
          </Select>
        </FieldRow>
      </SettingsSection>

      <SettingsSection
        id="comparison"
        title="Comparison"
        description="Changing the library resets its settings."
        action={
          <Select
            id="imageComparisonSelect"
            size="small"
            value={project.imageComparison}
            SelectDisplayProps={{ "aria-label": "Image comparison library" }}
            onChange={(event: SelectChangeEvent<string>) => {
              const imageComparison = event.target.value as ImageComparison;

              update({
                imageComparison,
                imageComparisonConfig:
                  project.imageComparison !== imageComparison
                    ? getDefaultConfig(imageComparison)
                    : project.imageComparisonConfig,
              });
            }}
          >
            <MenuItem value={ImageComparison.pixelmatch}>
              {ImageComparison.pixelmatch}
            </MenuItem>
            <MenuItem value={ImageComparison.lookSame}>
              {ImageComparison.lookSame}
            </MenuItem>
            <MenuItem value={ImageComparison.odiff}>
              {ImageComparison.odiff}
            </MenuItem>
            <MenuItem value={ImageComparison.vlm}>
              {ImageComparison.vlm}
            </MenuItem>
          </Select>
        }
      >
        {configForm}
      </SettingsSection>

      <PostAnalysisForm />
    </Stack>
  );
};
