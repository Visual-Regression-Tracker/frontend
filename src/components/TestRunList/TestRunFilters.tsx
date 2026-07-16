import React from "react";
import {
  Grid,
  TextField,
  Button,
  Autocomplete,
  Chip,
  Paper,
} from "@mui/material";
import { DebounceInput } from "react-debounce-input";
import { TestStatus } from "../../types";

interface IProps {
  tagOptions: string[];
  statusOptions: TestStatus[];
  name: string;
  statuses: TestStatus[];
  tags: string[];
  onNameChange: (value: string) => void;
  onStatusesChange: (value: TestStatus[]) => void;
  onTagsChange: (value: string[]) => void;
  onReset: () => void;
}

const TestRunFilters: React.FunctionComponent<IProps> = ({
  tagOptions,
  statusOptions,
  name,
  statuses,
  tags,
  onNameChange,
  onStatusesChange,
  onTagsChange,
  onReset,
}) => {
  const hasActiveFilters =
    name.length > 0 || statuses.length > 0 || tags.length > 0;

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Grid container spacing={2} alignItems="center" wrap="nowrap">
        <Grid item xs={3}>
          <DebounceInput
            size="small"
            variant="outlined"
            fullWidth
            label="Name"
            placeholder="Search by name"
            value={name}
            element={TextField}
            minLength={2}
            debounceTimeout={300}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </Grid>
        <Grid item xs>
          <Autocomplete
            multiple
            size="small"
            disableCloseOnSelect
            limitTags={3}
            options={tagOptions}
            value={tags}
            onChange={(_event, value) => onTagsChange(value)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option}
                  size="small"
                  label={option}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Tag"
                placeholder={tags.length === 0 ? "Any tag" : undefined}
              />
            )}
          />
        </Grid>
        <Grid item xs>
          <Autocomplete
            multiple
            size="small"
            disableCloseOnSelect
            limitTags={3}
            options={statusOptions}
            value={statuses}
            onChange={(_event, value) => onStatusesChange(value)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option}
                  size="small"
                  label={option}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Status"
                placeholder={statuses.length === 0 ? "Any status" : undefined}
              />
            )}
          />
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            color="primary"
            onClick={onReset}
            disabled={!hasActiveFilters}
          >
            Reset
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TestRunFilters;
