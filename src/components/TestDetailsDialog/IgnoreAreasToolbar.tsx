import { useState } from "react";
import {
  Grid,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  ToggleButton,
  Typography,
} from "@mui/material";
import {
  Add,
  Collections,
  Delete,
  LayersClear,
  Save,
} from "@mui/icons-material";
import { BaseModal } from "../BaseModal";
import { Tooltip } from "../Tooltip";
import { AREA_KINDS } from "../../constants";

const applyIgnoreAreaText =
  "Apply selected ignore area to all images in this build.";

interface IgnoreAreasToolbarProps {
  areaKind: string;
  onAreaKindChange: (kind: string) => void;
  isDrawMode: boolean;
  onDrawModeChange: (isDrawMode: boolean) => void;
  hasSelection: boolean;
  hasAreas: boolean;
  touched: boolean;
  onDelete: () => void;
  onClear: () => void;
  onApplyToBuild: () => void;
  onSave: () => void;
}

export const IgnoreAreasToolbar = ({
  areaKind,
  onAreaKindChange,
  isDrawMode,
  onDrawModeChange,
  hasSelection,
  hasAreas,
  touched,
  onDelete,
  onClear,
  onApplyToBuild,
  onSave,
}: IgnoreAreasToolbarProps) => {
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);

  const toggleApplyDialogOpen = () => {
    setApplyDialogOpen(!applyDialogOpen);
  };

  return (
    <>
      <Grid container spacing={2} sx={{ alignItems: "center" }}>
        <Grid>
          <Select
            variant="standard"
            id="area-select"
            labelId="areaSelect"
            // a standard select underlines itself and would read as a text field among buttons
            sx={{
              "&:before, &:after, &:hover:not(.Mui-disabled):before": {
                borderBottom: "none",
              },
            }}
            value={areaKind}
            onChange={(event: SelectChangeEvent<string>) =>
              onAreaKindChange(event.target.value)
            }
          >
            {AREA_KINDS.map((eachItem) => (
              <MenuItem key={eachItem} value={eachItem}>
                {eachItem}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid>
          <ToggleButton
            value={"drawMode"}
            selected={isDrawMode}
            size="small"
            onClick={() => {
              onDrawModeChange(!isDrawMode);
            }}
            style={{
              padding: 4,
            }}
          >
            <Add data-testid="AddIcon" />
          </ToggleButton>
        </Grid>
        <Grid>
          <IconButton
            size="small"
            disabled={!hasSelection || !hasAreas}
            onClick={onDelete}
          >
            <Delete data-testid="DeleteIcon" />
          </IconButton>
        </Grid>
        <Tooltip title="Clears all ignore areas." aria-label="reject">
          <Grid>
            <IconButton size="small" disabled={!hasAreas} onClick={onClear}>
              <LayersClear data-testid="LayersClearIcon" />
            </IconButton>
          </Grid>
        </Tooltip>
        <Tooltip title={applyIgnoreAreaText} aria-label="apply ignore area">
          <Grid>
            <IconButton
              size="small"
              disabled={!hasSelection || !hasAreas}
              onClick={toggleApplyDialogOpen}
            >
              <Collections data-testid="CollectionsIcon" />
            </IconButton>
          </Grid>
        </Tooltip>
        <Grid>
          <IconButton size="small" disabled={!touched} onClick={onSave}>
            <Save data-testid="SaveIcon" />
          </IconButton>
        </Grid>
      </Grid>
      <BaseModal
        open={applyDialogOpen}
        title={applyIgnoreAreaText}
        submitButtonText={"Yes"}
        onCancel={toggleApplyDialogOpen}
        content={
          <Typography>
            {`All images in the current build will be re-compared with new ignore area taken into account. Are you sure?`}
          </Typography>
        }
        onSubmit={() => {
          toggleApplyDialogOpen();
          onApplyToBuild();
        }}
      />
    </>
  );
};
