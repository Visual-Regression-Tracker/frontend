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
import { ProjectDto } from "../types";
import { ImageComparison } from "../types/imageComparison";

interface IProps {
  projectState: [ProjectDto, React.Dispatch<React.SetStateAction<ProjectDto>>];
}

export const ProjectForm: React.FunctionComponent<IProps> = ({
  projectState,
}) => {
  const [project, setProject] = projectState;

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
          setProject({
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
          setProject({
            ...project,
            mainBranchName: (event.target as HTMLInputElement).value,
          })
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
          onChange={(event) =>
            setProject({
              ...project,
              imageComparison: event.target.value as ImageComparison,
            })
          }
        >
          <MenuItem value={ImageComparison.pixelmatch}>
            {ImageComparison.pixelmatch}
          </MenuItem>
        </Select>
      </FormControl>
      <FormControlLabel
        label="Auto approve feature"
        control={
          <Switch
            checked={project.autoApproveFeature}
            onChange={(event, checked) =>
              setProject({
                ...project,
                autoApproveFeature: checked,
              })
            }
            color="primary"
            name="autoApproveFeature"
          />
        }
      />
      <FormControlLabel
        label="Allow diff dimentions"
        control={
          <Switch
            checked={project.diffDimensionsFeature}
            onChange={(event, checked) =>
              setProject({
                ...project,
                diffDimensionsFeature: checked,
              })
            }
            color="primary"
            name="diffDimensionsFeature"
          />
        }
      />
      <FormControlLabel
        label="Ignore anti-alliasing"
        control={
          <Switch
            checked={project.ignoreAntialiasing}
            onChange={(event, checked) =>
              setProject({
                ...project,
                ignoreAntialiasing: checked,
              })
            }
            color="primary"
            name="ignoreAntialiasing"
          />
        }
      />
      <TextValidator
        name="threshold"
        validators={["minNumber:0", "maxNumber:1"]}
        errorMessages={["Enter greater than 0", "Enter less than 1"]}
        InputProps={{ inputProps: { min: 0, max: 1, step: 0.001 } }}
        margin="dense"
        id="threshold"
        label="Pixel diff threshold"
        type="number"
        fullWidth
        required
        value={project.threshold}
        onChange={(event) => {
          const value = (event.target as HTMLInputElement).value;
          setProject({
            ...project,
            threshold: parseFloat(value),
          });
        }}
      />
    </React.Fragment>
  );
};
