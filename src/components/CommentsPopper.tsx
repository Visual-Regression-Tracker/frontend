import React from "react";
import {
  Button,
  Popper,
  Fade,
  Paper,
  makeStyles,
  TextField,
  Badge,
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
  contentContainer: {
    padding: theme.spacing(2),
  },
}));

interface IProps {
  text: string | undefined;
  onSave: (comment: string) => Promise<any>;
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

  React.useEffect(() => setComment(text ? text : ""), [text]);

  return (
    <React.Fragment>
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
                  rowsMax={10}
                  fullWidth
                  onChange={(event) =>
                    setComment((event.target as HTMLInputElement).value)
                  }
                  inputProps={{
                    "data-testId": "comment",
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
    </React.Fragment>
  );
};
