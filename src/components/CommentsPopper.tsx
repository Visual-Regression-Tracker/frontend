import {
  type ChangeEvent,
  Fragment,
  type KeyboardEvent,
  useId,
  useState,
} from "react";
import {
  Button,
  Popper,
  Fade,
  IconButton,
  Paper,
  TextField,
  Chip,
  Box,
} from "@mui/material";
import { ChatBubble, ChatBubbleOutlined } from "@mui/icons-material";
import {
  usePopupState,
  bindToggle,
  bindPopper,
} from "material-ui-popup-state/hooks";
import { CommentText, visuallyHidden } from "./CommentIndicator";
import { Tooltip } from "./Tooltip";

const firstLine = (text: string) => text.trim().split(/\r?\n/)[0];

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
  const [saved, setSaved] = useState(text || "");
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const descriptionId = useId();
  if (text !== shownText) {
    setShownText(text);
    setComment(text || "");
    setSaved(text || "");
  }

  const savedComment = saved.trim() ? saved : "";

  // Escape closes the box, not the dialog around it
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape" && popupState.isOpen) {
      event.stopPropagation();
      popupState.close();
    }
  };

  return (
    <>
      <Box component="span" ref={setAnchorEl} sx={{ display: "inline-flex" }}>
        {savedComment ? (
          <Tooltip title={<CommentText text={savedComment} />} describeChild>
            <Chip
              {...bindToggle(popupState)}
              aria-describedby={descriptionId}
              clickable
              color="secondary"
              icon={<ChatBubble />}
              label={firstLine(savedComment)}
              aria-label={`Edit comment: ${firstLine(savedComment)}`}
              onKeyDown={closeOnEscape}
              sx={{ maxWidth: 220 }}
            />
          </Tooltip>
        ) : (
          <Tooltip title="Add comment">
            <IconButton
              {...bindToggle(popupState)}
              aria-label="Add comment"
              onKeyDown={closeOnEscape}
              sx={{ color: "text.secondary" }}
            >
              <ChatBubbleOutlined />
            </IconButton>
          </Tooltip>
        )}
        <Box component="span" id={descriptionId} sx={visuallyHidden}>
          {savedComment}
        </Box>
      </Box>
      <Popper
        {...bindPopper(popupState)}
        anchorEl={anchorEl}
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
                      () => {
                        setSaved(comment);
                        popupState.close();
                      },
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
