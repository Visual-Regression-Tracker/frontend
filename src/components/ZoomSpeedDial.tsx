import React from "react";
import { makeStyles, createStyles, Theme } from "@material-ui/core/styles";
import { SpeedDial, SpeedDialIcon, SpeedDialAction } from "@material-ui/lab";
import {
  ZoomIn,
  ZoomOut,
  Fullscreen,
  FullscreenExit,
} from "@material-ui/icons";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    speedDial: {
      position: "absolute",
      "&.MuiSpeedDial-directionUp": {
        bottom: theme.spacing(2),
        right: theme.spacing(2),
      },
    },
  })
);

interface IProps {
  onZoomInClick: () => void;
  onZoomOutClick: () => void;
  onOriginalSizeClick: () => void;
  onFitIntoScreenClick: () => void;
}

export const ScaleActionsSpeedDial: React.FunctionComponent<IProps> = ({
  onZoomInClick,
  onZoomOutClick,
  onOriginalSizeClick,
  onFitIntoScreenClick,
}) => {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  return (
    <SpeedDial
      ariaLabel="Scale actions"
      className={classes.speedDial}
      icon={<SpeedDialIcon />}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      direction="up"
    >
      <SpeedDialAction
        icon={<ZoomIn />}
        tooltipTitle={"Zoom In"}
        onClick={onZoomInClick}
      />
      <SpeedDialAction
        icon={<ZoomOut />}
        tooltipTitle={"Zoom Out"}
        onClick={onZoomOutClick}
      />
      <SpeedDialAction
        icon={<Fullscreen />}
        tooltipTitle={"Original size"}
        onClick={onOriginalSizeClick}
      />
      <SpeedDialAction
        icon={<FullscreenExit />}
        tooltipTitle={"Fit into screen"}
        onClick={onFitIntoScreenClick}
      />
    </SpeedDial>
  );
};
