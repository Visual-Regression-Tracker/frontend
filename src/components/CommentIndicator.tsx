import { Box } from "@mui/material";
import { ChatBubble } from "@mui/icons-material";
import { Tooltip } from "./Tooltip";

export const CommentText = ({ text }: { text: string }) => (
  <Box sx={{ whiteSpace: "pre-wrap", maxWidth: 320 }}>{text}</Box>
);

export const CommentIndicator = ({ text }: { text?: string | null }) => {
  if (!text?.trim()) {
    return null;
  }

  return (
    <Tooltip title={<CommentText text={text} />} describeChild>
      <Box
        component="span"
        role="img"
        aria-label="Has a comment"
        data-testid="comment-indicator"
        sx={{ display: "inline-flex", color: "secondary.main", flexShrink: 0 }}
      >
        <ChatBubble sx={{ fontSize: 16 }} />
      </Box>
    </Tooltip>
  );
};
