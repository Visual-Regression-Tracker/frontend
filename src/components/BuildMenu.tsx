import { useState } from "react";
import { Divider, Menu, MenuItem, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import { deleteBuild, useBuildDispatch } from "../contexts";
import { buildsService } from "../services";
import { AT_LEAST_TWO_CHARACTERS } from "../_helpers/validation";
import type { Build } from "../types";
import { BaseModal } from "./BaseModal";
import { ValidatedTextField } from "./ValidatedForm";

interface BuildMenuAnalysis {
  label: string;
  disabled: boolean;
  onClick: () => void;
}

interface IProps {
  build: Build;
  anchorEl: HTMLElement | null;
  analysis?: BuildMenuAnalysis;
  onClose: () => void;
  onDeleted: (build: Build) => void;
}

type Dialog = "edit" | "delete";

export const BuildMenu = ({
  build,
  anchorEl,
  analysis,
  onClose,
  onDeleted,
}: IProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const buildDispatch = useBuildDispatch();
  const [dialog, setDialog] = useState<Dialog>();
  const [newCiBuildId, setNewCiBuildId] = useState("");
  const label = `#${build.number || build.id}`;
  const fail = (err: string) => enqueueSnackbar(err, { variant: "error" });

  const stop = () => {
    buildsService
      .update(build.id, { isRunning: false })
      .then(() =>
        enqueueSnackbar(`${build.id} finished`, { variant: "success" }),
      )
      .catch(fail);
    onClose();
  };

  const remove = () => {
    deleteBuild(buildDispatch, build.id)
      .then(() => {
        enqueueSnackbar(`Build ${label} deleted`, { variant: "success" });
        onDeleted(build);
      })
      .catch(fail);
    onClose();
  };

  const edit = () => {
    buildsService.update(build.id, { ciBuildId: newCiBuildId }).catch(fail);
    onClose();
  };

  return (
    <>
      <Menu anchorEl={anchorEl} open={!dialog} onClose={onClose}>
        {build.isRunning && <MenuItem onClick={stop}>Stop build</MenuItem>}
        {analysis && (
          <MenuItem
            disabled={analysis.disabled}
            onClick={() => {
              analysis.onClick();
              onClose();
            }}
          >
            {analysis.label}
          </MenuItem>
        )}
        <MenuItem onClick={() => setDialog("edit")}>Edit CI build id…</MenuItem>
        <Divider component="li" />
        <MenuItem
          sx={{ color: "error.main" }}
          onClick={() => setDialog("delete")}
        >
          Delete build…
        </MenuItem>
      </Menu>
      <BaseModal
        open={dialog === "edit"}
        title="Edit CI build id"
        size="md"
        submitButtonText="Edit"
        onCancel={onClose}
        content={
          <>
            <Typography>{`Edit the ci build id for build: ${label}`}</Typography>
            <ValidatedTextField
              name="newCiBuildId"
              rules={AT_LEAST_TWO_CHARACTERS}
              margin="dense"
              id="name"
              label="New CI Build Id"
              type="text"
              fullWidth
              required
              value={newCiBuildId}
              onChange={(event) => setNewCiBuildId(event.target.value)}
              slotProps={{ htmlInput: { "data-testid": "newCiBuildId" } }}
            />
          </>
        }
        onSubmit={edit}
      />
      <BaseModal
        open={dialog === "delete"}
        title="Delete build"
        submitButtonText="Delete"
        submitColor="error"
        onCancel={onClose}
        content={
          <Typography>{`Are you sure you want to delete build: ${label}?`}</Typography>
        }
        onSubmit={remove}
      />
    </>
  );
};
