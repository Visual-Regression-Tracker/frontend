import {
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
} from "@material-ui/core";
import React from "react";
import { TextValidator } from "react-material-ui-form-validator";
import {
  useProjectState,
  useProjectDispatch,
  setProjectEditState,
} from "../../contexts";
import { ImageComparison } from "../../types/imageComparison";
import { LooksSameConfigForm } from "./LooksSameConfigForm";
import { OdiffConfigForm } from "./OdiffConfigForm";
import { PixelmatchConfigForm } from "./PixelmatchConfigForm";
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
        onChange={(event) => {
          setProjectEditState(projectDispatch, {
            ...project,
            name: (event.target as HTMLInputElement).value,
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
        onChange={(event) =>
          setProjectEditState(projectDispatch, {
            ...project,
            mainBranchName: (event.target as HTMLInputElement).value,
          })
        }
      />
      <TextValidator
        name="buildCount"
        validators={["minNumber:1"]}
        errorMessages={["Enter greater than 1"]}
        InputProps={{ inputProps: { min: 1, step: 1 } }}
        margin="dense"
        id="buildCount"
        label="Number of builds to keep"
        type="number"
        fullWidth
        required
        value={project.maxBuildAllowed}
        onChange={(event) => {
          const value = (event.target as HTMLInputElement).value;
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
        InputProps={{ inputProps: { min: 1, step: 1 } }}
        margin="dense"
        id="maxBranchLifetime"
        label="Max branch lifetime (days)"
        type="number"
        fullWidth
        required
        value={project.maxBranchLifetime}
        onChange={(event) => {
          const value = (event.target as HTMLInputElement).value;
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
      <FormControl fullWidth>
        <InputLabel id="imageComparisonSelect">
          Image comparison library
        </InputLabel>
        <Select
          id="imageComparisonSelect"
          labelId="imageComparisonSelect"
          value={project.imageComparison}
          onChange={(event) => {
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
        </Select>
      </FormControl>

      {config}
    </React.Fragment>
  );
};
