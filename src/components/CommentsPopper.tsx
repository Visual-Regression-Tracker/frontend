import React from "react";
import {
  Button,
  Popper,
  Fade,
  Paper,
  makeStyles,
  TextField,
  Badge,
  IconButton,
} from "@material-ui/core";
import {
  usePopupState,
  bindToggle,
  bindPopper,
} from "material-ui-popup-state/hooks";
import { Comment } from "@material-ui/icons";

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
      <IconButton {...bindToggle(popupState)}>
        <Badge
          color="secondary"
          variant="dot"
          invisible={!comment || comment === ""}
        >
          <Comment />
        </Badge>
      </IconButton>
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
    </React.Fragment>
  );
};
