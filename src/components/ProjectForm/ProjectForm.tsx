import {
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  SelectChangeEvent,
} from "@mui/material";
import React from "react";
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
import { getDefaultConfig } from "./utils";

export const ProjectForm: React.FunctionComponent = () => {
  const { projectEditState: project } = useProjectState();
  const projectDispatch = useProjectDispatch();

  const config = React.useMemo(() => {
    switch (project.imageComparison) {
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
  }, [project.imageComparison]);

  return (
    <React.Fragment>
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
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setProjectEditState(projectDispatch, {
            ...project,
            name: event.target.value,
          });
        }}
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
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setProjectEditState(projectDispatch, {
            ...project,
            mainBranchName: event.target.value,
          })
        }
      />
      <TextValidator
        name="buildCount"
        validators={["minNumber:1"]}
        errorMessages={["Enter greater than 1"]}
        InputProps={{
          inputProps: {
            min: 1,
            step: 1,
          },
        }}
        margin="dense"
        id="buildCount"
        label="Number of builds to keep"
        type="number"
        fullWidth
        required
        value={project.maxBuildAllowed}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          const { value } = event.target;

          setProjectEditState(projectDispatch, {
            ...project,
            maxBuildAllowed: parseInt(value),
          });
        }}
      />
      <TextValidator
        name="maxBranchLifetime"
        validators={["minNumber:1"]}
        errorMessages={["Enter greater than 1"]}
        InputProps={{
          inputProps: {
            min: 1,
            step: 1,
          },
        }}
        margin="dense"
        id="maxBranchLifetime"
        label="Max branch lifetime (days)"
        type="number"
        fullWidth
        required
        value={project.maxBranchLifetime}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          const { value } = event.target;

          setProjectEditState(projectDispatch, {
            ...project,
            maxBranchLifetime: parseInt(value),
          });
        }}
      />
      <FormControlLabel
        label="Auto approve feature"
        control={
          <Switch
            checked={project.autoApproveFeature}
            onChange={(event, checked) =>
              setProjectEditState(projectDispatch, {
                ...project,
                autoApproveFeature: checked,
              })
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
              onChange={(event, checked) =>
                setProjectEditState(projectDispatch, {
                  ...project,
                  bulkApproveVariations: checked,
                })
              }
              color="primary"
              name="bulkApproveVariations"
            />
          }
        />
      </Tooltip>
      {project.bulkApproveVariations && (
        <Tooltip title="Which test-variation axis differs within a group. Screens that match on everything except this axis are reviewed together — e.g. customTags for per-locale screenshots.">
          <FormControl variant="standard" fullWidth>
            <InputLabel id="bulkApproveGroupBySelect">
              Group variations by
            </InputLabel>
            <Select
              variant="standard"
              id="bulkApproveGroupBySelect"
              labelId="bulkApproveGroupBySelect"
              value={project.bulkApproveGroupBy}
              onChange={(event: SelectChangeEvent<HTMLInputElement>) =>
                setProjectEditState(projectDispatch, {
                  ...project,
                  bulkApproveGroupBy: event.target.value as string,
                })
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
      )}
      <FormControl variant="standard" fullWidth>
        <InputLabel id="imageComparisonSelect">
          Image comparison library
        </InputLabel>
        <Select
          variant="standard"
          id="imageComparisonSelect"
          labelId="imageComparisonSelect"
          value={project.imageComparison}
          onChange={(event: SelectChangeEvent<HTMLInputElement>) => {
            const imageComparison = event.target.value as ImageComparison;

            setProjectEditState(projectDispatch, {
              ...project,
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
          <MenuItem value={ImageComparison.vlm}>{ImageComparison.vlm}</MenuItem>
        </Select>
      </FormControl>
      {config}
    </React.Fragment>
  );
};
