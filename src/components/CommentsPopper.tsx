import React from "react";
import { styled } from "@mui/material/styles";
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

const PREFIX = "CommentsPopper";

const classes = {
  popperContainer: `${PREFIX}-popperContainer`,
  contentContainer: `${PREFIX}-contentContainer`,
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled("div")(({ theme: Theme }) => ({
  [`& .${classes.popperContainer}`]: {
    zIndex: 1400,
  },

  [`& .${classes.contentContainer}`]: {
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
  const popupState = usePopupState({
    variant: "popper",
    popupId: "commentPopper",
  });

  const [comment, setComment] = React.useState("");

  React.useEffect(() => setComment(text || ""), [text]);

  return (
    <Root>
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
    </Root>
  );
};
