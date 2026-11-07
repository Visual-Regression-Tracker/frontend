import {
  type ChangeEvent,
  Fragment,
  type KeyboardEvent,
  useState,
} from "react";
import {
  Button,
  Popper,
  Fade,
  IconButton,
  Paper,
  TextField,
  Badge,
} from "@mui/material";
import { ChatBubbleOutlined } from "@mui/icons-material";
import {
  usePopupState,
  bindToggle,
  bindPopper,
} from "material-ui-popup-state/hooks";
import { Tooltip } from "./Tooltip";

interface IProps {
  text: string | undefined;
  onSave: (comment: string) => Promise<void | string | number>;
}

export const CommentsPopper = ({ text, onSave }: IProps) => {
  const popupState = usePopupState({
    variant: "popper",
    popupId: "commentPopper",
  });

  const [comment, setComment] = useState(text || "");
  const [shownText, setShownText] = useState(text);
  if (text !== shownText) {
    setShownText(text);
    setComment(text || "");
  }

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
          vertical: "top",
          horizontal: "right",
        }}
        invisible={!comment || comment === ""}
      >
        <Tooltip title="Comments">
          <IconButton
            {...bindToggle(popupState)}
            aria-label="Comments"
            color="primary"
            onKeyDown={closeOnEscape}
          >
            <ChatBubbleOutlined />
          </IconButton>
        </Tooltip>
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
                  slotProps={{
                    htmlInput: {
                      "data-testid": "comment",
                    },
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
