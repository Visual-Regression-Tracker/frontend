import {
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  SelectChangeEvent,
} from "@mui/material";
import { type ChangeEvent, Fragment } from "react";
import { TextValidator } from "react-material-ui-form-validator";
import {
  useProjectState,
  useProjectDispatch,
  setProjectEditState,
} from "../../contexts";
import { ImageComparison } from "../../types/imageComparison";
import { Tooltip } from "../Tooltip";
import { LooksSameConfigForm } from "./LooksSameConfigForm";
import { OdiffConfigForm } from "./OdiffConfigForm";
import { PixelmatchConfigForm } from "./PixelmatchConfigForm";
import { VlmConfigForm } from "./VlmConfigForm";
import { getDefaultConfig, withBlurAmplitudeOf } from "./utils";

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

  const update = (patch: Partial<typeof project>) =>
    setProjectEditState(projectDispatch, { ...project, ...patch });

  const wholeNumberField = (
    name: string,
    label: string,
    field: "maxBuildAllowed" | "maxBranchLifetime",
  ) => (
    <TextValidator
      name={name}
      validators={["minNumber:1"]}
      errorMessages={["Enter greater than 1"]}
      InputProps={{
        inputProps: {
          min: 1,
          step: 1,
        },
      }}
      margin="dense"
      id={name}
      label={label}
      type="number"
      fullWidth
      required
      value={project[field]}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        update({ [field]: parseInt(event.target.value) })
      }
    />
  );

  return (
    <Fragment>
      <TextValidator
        name="projectName"
        validators={["minStringLength:2"]}
        errorMessages={["Enter at least two characters."]}
        margin="dense"
        id="name"
        label="Project name"
        type="text"
        fullWidth
        required
        value={project.name}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          update({ name: event.target.value })
        }
      />
      <TextValidator
        name="mainBranchName"
        validators={["minStringLength:2"]}
        errorMessages={["Enter at least two characters."]}
        margin="dense"
        id="branchName"
        label="Main branch"
        type="text"
        fullWidth
        required
        value={project.mainBranchName}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          update({ mainBranchName: event.target.value })
        }
      />
      {wholeNumberField(
        "buildCount",
        "Number of builds to keep",
        "maxBuildAllowed",
      )}
      {wholeNumberField(
        "maxBranchLifetime",
        "Max branch lifetime (days)",
        "maxBranchLifetime",
      )}
      <FormControlLabel
        label="Auto approve feature"
        control={
          <Switch
            checked={project.autoApproveFeature}
            onChange={(_event, checked) =>
              update({ autoApproveFeature: checked })
            }
            color="primary"
            name="autoApproveFeature"
          />
        }
      />
      <Tooltip title="Review and bulk approve or reject a screen's variations (e.g. all locales) in one dialog. Only variations with the same change are pre-selected; different ones are left for manual review.">
        <FormControlLabel
          label="Bulk approve/reject variations"
          control={
            <Switch
              checked={project.bulkApproveVariations}
              onChange={(_event, checked) =>
                update({ bulkApproveVariations: checked })
              }
              color="primary"
              name="bulkApproveVariations"
            />
          }
        />
      </Tooltip>
      {/* Not tied to the switch: the axis groups runs in the list either way */}
      <Tooltip title="Which test-variation axis differs within a group. Screens that match on everything except this axis are grouped in the test run list and reviewed together — e.g. customTags for per-locale screenshots.">
        <FormControl variant="standard" fullWidth>
          <InputLabel id="bulkApproveGroupBySelect">
            Group variations by
          </InputLabel>
          <Select
            variant="standard"
            id="bulkApproveGroupBySelect"
            labelId="bulkApproveGroupBySelect"
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
        </FormControl>
      </Tooltip>
      <FormControl variant="standard" fullWidth>
        <InputLabel id="imageComparisonSelect">
          Image comparison library
        </InputLabel>
        <Select
          variant="standard"
          id="imageComparisonSelect"
          labelId="imageComparisonSelect"
          value={project.imageComparison}
          onChange={(event: SelectChangeEvent<string>) => {
            const imageComparison = event.target.value as ImageComparison;

            update({
              imageComparison,
              imageComparisonConfig:
                project.imageComparison !== imageComparison
                  ? withBlurAmplitudeOf(
                      getDefaultConfig(imageComparison),
                      project.imageComparisonConfig,
                    )
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
          <MenuItem value={ImageComparison.vlm}>{ImageComparison.vlm}</MenuItem>
        </Select>
      </FormControl>
      {configFormFor(project.imageComparison)}
    </Fragment>
  );
};
