import React from "react";
import {
  Button,
  Popper,
  Fade,
  Paper,
  Typography,
  Box,
  makeStyles,
} from "@material-ui/core";
import {
  usePopupState,
  bindToggle,
  bindPopper,
} from "material-ui-popup-state/hooks";

const useStyles = makeStyles((theme) => ({
  popperContainer: {
    zIndex: 1400,
  },
}));

export const CommentsPopper = () => {
  const classes = useStyles();
  const popupState = usePopupState({
    variant: "popper",
    popupId: "demoPopper",
  });
  return (
    <React.Fragment>
      <Button color="primary" {...bindToggle(popupState)}>
        Comments
      </Button>
      <Popper
        {...bindPopper(popupState)}
        transition
        className={classes.popperContainer}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper>
              <Typography>The content of the Popper.</Typography>
            </Paper>
          </Fade>
        )}
      </Popper>
    </React.Fragment>
  );
};
