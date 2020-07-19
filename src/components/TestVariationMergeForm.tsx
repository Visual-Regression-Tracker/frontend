import React from "react";
import { Grid, Select, MenuItem, Button } from "@material-ui/core";
import { testVariationService } from "../services";
import { useHistory } from "react-router-dom";
import { buildBuildPageUrl } from "../_helpers/route.helpers";
import { useSnackbar } from "notistack";

interface IProps {
  projectId: string;
  items: string[];
}

export const TestVariationMergeForm: React.FunctionComponent<IProps> = ({
  projectId,
  items,
}) => {
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const [branch, setBranch] = React.useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    testVariationService
      .merge(projectId, branch)
      .then((build) => {
        enqueueSnackbar(`Merge started in build: ${build.id}`, {
          variant: "success",
        });
        history.push(buildBuildPageUrl(projectId, build.id));
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
          <Button type="submit" color="primary" variant="contained">
            Merge
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};
