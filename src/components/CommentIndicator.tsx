import { useId } from "react";
import { Box } from "@mui/material";
import { ChatBubble } from "@mui/icons-material";
import { Tooltip } from "./Tooltip";

const TOOLTIP_LINES = 12;

export const visuallyHidden = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: "1px",
} as const;

export const CommentText = ({ text }: { text: string }) => (
  <Box
    sx={{
      whiteSpace: "pre-wrap",
      maxWidth: 320,
      display: "-webkit-box",
      WebkitBoxOrient: "vertical",
      WebkitLineClamp: TOOLTIP_LINES,
      overflow: "hidden",
      overflowWrap: "anywhere",
    }}
  >
    {text.trim()}
  </Box>
);

export const CommentIndicator = ({ text }: { text?: string | null }) => {
  const descriptionId = useId();

  if (!text?.trim()) {
    return null;
  }

  return (
    <Tooltip title={<CommentText text={text} />} describeChild>
      <Box
        component="span"
        role="img"
        tabIndex={0}
        aria-label="Has a comment"
        aria-describedby={descriptionId}
        data-testid="comment-indicator"
        sx={{ display: "inline-flex", color: "secondary.main", flexShrink: 0 }}
      >
        <ChatBubble sx={{ fontSize: 16 }} />
        <Box component="span" id={descriptionId} sx={visuallyHidden}>
          {text}
        </Box>
      </Box>
    </Tooltip>
  );
};
