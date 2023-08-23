import React from "react";
import { makeStyles } from "@mui/styles";
import {
  Button,
  Popper,
  Fade,
  Paper,
  TextField,
  Badge,
  type Theme,
} from "@mui/material";
import {
  usePopupState,
  bindToggle,
  bindPopper,
} from "material-ui-popup-state/hooks";

const useStyles = makeStyles((theme: Theme) => ({
  popperContainer: {
    zIndex: 1400,
  },
  contentContainer: {
    padding: theme.spacing(2),
  },
}));

interface IProps {
  text: string | undefined;
  onSave: (comment: string) => Promise<void | string | number>;
}

export const CommentsPopper: React.FunctionComponent<IProps> = ({
  text,
  onSave,
}) => {
  const classes = useStyles();
  const popupState = usePopupState({
    variant: "popper",
    popupId: "commentPopper",
  });

  const [comment, setComment] = React.useState("");

  React.useEffect(() => setComment(text || ""), [text]);

  return (
    <>
      <Badge
        color="secondary"
        variant="dot"
        badgeContent=" "
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        invisible={!comment || comment === ""}
      >
        <Button {...bindToggle(popupState)} color="primary">
          Comments
        </Button>
      </Badge>
      <Popper
        {...bindPopper(popupState)}
        transition
        disablePortal
        className={classes.popperContainer}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper className={classes.contentContainer}>
              <React.Fragment>
                <TextField
                  id="comment"
                  name="comment"
                  variant="outlined"
                  value={comment}
                  placeholder={"Add any additional data here"}
                  multiline
                  rows={4}
                  fullWidth
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setComment(event.target.value)
                  }
                  inputProps={{
                    "data-testid": "comment",
                  }}
                />
                <Button
                  onClick={() => {
                    onSave(comment).then(() => popupState.close());
                  }}
                >
                  Save
                </Button>
              </React.Fragment>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  );
};
