import React from "react";
import { Grid, Select, MenuItem, Button, TextField } from "@material-ui/core";
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
  const [fromBranch, setFromBranch] = React.useState("");
  const [toBranch, setToBranch] = React.useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    testVariationService
      .merge(projectId, fromBranch, toBranch)
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
      <Grid container spacing={2}>
        <Grid item>
          <Select
            displayEmpty
            value={fromBranch}
            onChange={(event) => setFromBranch(event.target.value as string)}
          >
            <MenuItem value="">
              <em>From branch</em>
            </MenuItem>
            {items.map((i) => (
              <MenuItem key={i} value={i}>
                {i}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item>
          <TextField
            id="toBranch"
            name="toBranch"
            value={toBranch}
            label={"To Branch"}
            type="text"
            variant="outlined"
            required
            fullWidth
            inputProps={{
              onChange: (event: any) =>
                setToBranch((event.target as HTMLInputElement).value),
              "data-testid": "toBranch",
            }}
          />
        </Grid>
        <Grid item>
          <Button type="submit" color="primary" variant="contained">
            Merge
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};
