import {
  type ChangeEvent,
  Fragment,
  type KeyboardEvent,
  useEffect,
  useState,
} from "react";
import { Button, Popper, Fade, Paper, TextField, Badge } from "@mui/material";
import {
  usePopupState,
  bindToggle,
  bindPopper,
} from "material-ui-popup-state/hooks";

interface IProps {
  text: string | undefined;
  onSave: (comment: string) => Promise<void | string | number>;
}

export const CommentsPopper = ({ text, onSave }: IProps) => {
  const popupState = usePopupState({
    variant: "popper",
    popupId: "commentPopper",
  });

  const [comment, setComment] = useState("");

  useEffect(() => setComment(text || ""), [text]);

  // Escape closes the box, not the dialog around it
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape" && popupState.isOpen) {
      event.stopPropagation();
      popupState.close();
    }
  };

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
        <Button
          {...bindToggle(popupState)}
          color="primary"
          onKeyDown={closeOnEscape}
        >
          Comments
        </Button>
      </Badge>
      <Popper
        {...bindPopper(popupState)}
        transition
        disablePortal
        sx={{ zIndex: 1400 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper sx={{ padding: 2 }} onKeyDown={closeOnEscape}>
              <Fragment>
                <TextField
                  id="comment"
                  name="comment"
                  variant="outlined"
                  value={comment}
                  placeholder={"Add any additional data here"}
                  multiline
                  rows={4}
                  fullWidth
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setComment(event.target.value)
                  }
                  inputProps={{
                    "data-testid": "comment",
                  }}
                />
                <Button
                  onClick={() => {
                    // a failed save is the caller's to report; the box stays open
                    onSave(comment).then(
                      () => popupState.close(),
                      () => undefined,
                    );
                  }}
                >
                  Save
                </Button>
              </Fragment>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  );
};
