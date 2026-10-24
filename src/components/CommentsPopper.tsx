import React from "react";
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

  // Escape closes the box, not the dialog around it, which would drop the
  // draft from view; the draft itself stays for the next open
  const closeOnEscape = (event: React.KeyboardEvent) => {
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
                    // a failed save is the caller's to report; the box stays
                    // open with the draft so it can be saved again
                    onSave(comment).then(
                      () => popupState.close(),
                      () => undefined,
                    );
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
