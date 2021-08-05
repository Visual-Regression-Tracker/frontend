import React from "react";
import { Grid, Select, MenuItem, Button } from "@material-ui/core";
import { testVariationService } from "../services";
import { useHistory } from "react-router-dom";
import {
  buildProjectPageUrl,
  buildTestRunLocation,
} from "../_helpers/route.helpers";
import { useSnackbar } from "notistack";
import { selectBuild, useBuildDispatch } from "../contexts";

interface IProps {
  projectId: string;
  items: string[];
}

export const TestVariationMergeForm: React.FunctionComponent<IProps> = ({
  projectId,
  items,
}) => {
  const history = useHistory();
  const buildDispatch = useBuildDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [branch, setBranch] = React.useState("");

  const locatorSelectBranch = "select-branch";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    testVariationService
      .merge(projectId, branch)
      .then((build) => {
        enqueueSnackbar(`Merge started in build: ${build.id}`, {
          variant: "success",
        });
        history.push({
          pathname: buildProjectPageUrl(projectId),
          ...buildTestRunLocation(build.id),
        });
        selectBuild(buildDispatch, build.id);
      })
      .catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        })
      );
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2} alignItems="flex-end">
        <Grid item>
          <Select
            displayEmpty
            value={branch}
            onChange={(event) => setBranch(event.target.value as string)}
          >
            <MenuItem value="">
              <em>Select branch</em>
            </MenuItem>
            {items.map((i) => (
              <MenuItem key={i} value={i}>
                {i}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            id={locatorSelectBranch}
          >
            Merge
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};
