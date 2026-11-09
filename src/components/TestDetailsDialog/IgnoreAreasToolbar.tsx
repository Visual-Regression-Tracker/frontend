import { type ReactNode, useState } from "react";
import {
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
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
import { TEST_ID } from "../../constants/locators";

const applyIgnoreAreaText =
  "Apply selected ignore area to all images in this build.";
const textButtonSx = { textTransform: "none" } as const;

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
  onCancel: () => void;
}

const ToolButton = ({
  tooltip,
  children,
  ...props
}: {
  tooltip?: string;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  startIcon: ReactNode;
  color?: "primary" | "secondary";
}) => {
  const button = (
    <Button size="small" sx={textButtonSx} {...props}>
      {children}
    </Button>
  );

  return tooltip ? (
    <Tooltip title={tooltip}>
      <span>{button}</span>
    </Tooltip>
  ) : (
    button
  );
};

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
  onCancel,
}: IgnoreAreasToolbarProps) => {
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);

  const toggleApplyDialogOpen = () => {
    setApplyDialogOpen(!applyDialogOpen);
  };

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            flexWrap: "wrap",
            rowGap: 0.5,
            flex: 1,
            minWidth: 0,
          }}
        >
          <Typography variant="body2" color="textSecondary">
            Editing areas
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={areaKind}
            aria-label="Area type"
            onChange={(_event, value: string | null) =>
              value && onAreaKindChange(value)
            }
          >
            {AREA_KINDS.map((kind) => (
              <ToggleButton key={kind} value={kind} sx={textButtonSx}>
                {kind === AREA_KINDS[0] ? "Ignore areas" : "Compare area"}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <ToggleButton
            value="drawMode"
            selected={isDrawMode}
            size="small"
            onClick={() => onDrawModeChange(!isDrawMode)}
            sx={{ ...textButtonSx, gap: 0.5 }}
          >
            <Add fontSize="small" data-testid={TEST_ID.addIcon} />
            Draw
          </ToggleButton>
          <ToolButton
            startIcon={<Delete data-testid={TEST_ID.deleteIcon} />}
            disabled={!hasSelection || !hasAreas}
            onClick={onDelete}
          >
            Delete selected
          </ToolButton>
          <ToolButton
            tooltip="Clears all ignore areas."
            startIcon={<LayersClear data-testid={TEST_ID.layersClearIcon} />}
            disabled={!hasAreas}
            onClick={onClear}
          >
            Clear all
          </ToolButton>
          <ToolButton
            tooltip={applyIgnoreAreaText}
            startIcon={<Collections data-testid={TEST_ID.collectionsIcon} />}
            disabled={!hasSelection || !hasAreas}
            onClick={toggleApplyDialogOpen}
          >
            Apply selected to whole build…
          </ToolButton>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button size="small" color="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<Save data-testid={TEST_ID.saveIcon} />}
            disabled={!touched}
            onClick={onSave}
          >
            Save
          </Button>
        </Stack>
      </Stack>
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
