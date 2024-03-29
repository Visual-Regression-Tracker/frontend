import React from "react";
import {
  Autocomplete,
  Grid,
  Select,
  MenuItem,
  Button,
  TextField,
  SelectChangeEvent,
} from "@mui/material";
import { testVariationService } from "../services";
import { useNavigate } from "react-router-dom";
import {
  buildProjectPageUrl,
  buildTestRunLocation,
} from "../_helpers/route.helpers";
import { useSnackbar } from "notistack";
import { selectBuild, useBuildDispatch } from "../contexts";
import { LOCATOR_TEST_VARIATION_SELECT_BRANCH } from "../constants/help";

const isString = (a): a is string => typeof a === "string";

interface IProps {
  projectId: string;
  items: string[];
}

export const TestVariationMergeForm: React.FunctionComponent<IProps> = ({
  projectId,
  items,
}) => {
  const navigate = useNavigate();
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
        navigate({
          pathname: buildProjectPageUrl(projectId),
          ...buildTestRunLocation(build.id),
        });
        selectBuild(buildDispatch, build.id);
      })
      .catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        }),
      );
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2} alignItems="flex-end">
        <Grid item xs>
          <Select
            variant="standard"
            required
            fullWidth
            displayEmpty
            value={fromBranch}
            onChange={(event: SelectChangeEvent<HTMLInputElement>) =>
              setFromBranch(event.target.value as string)
            }
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
        <Grid item xs>
          <Autocomplete
            id="toBranch"
            options={items.map((i) => ({
              title: i,
            }))}
            getOptionLabel={(option) =>
              isString(option) ? option : option.title
            }
            freeSolo
            fullWidth
            renderInput={(params) => (
              <TextField
                variant="standard"
                {...params}
                required
                label="To branch"
              />
            )}
            onInputChange={(_, value) => {
              setToBranch(value);
            }}
          />
        </Grid>
        <Grid item>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            id={LOCATOR_TEST_VARIATION_SELECT_BRANCH}
          >
            Merge
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};
