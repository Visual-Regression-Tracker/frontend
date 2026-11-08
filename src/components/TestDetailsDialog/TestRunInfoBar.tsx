import { type ReactNode, useState } from "react";
import { Alert, Box, Button, Divider, Stack, Typography } from "@mui/material";
import { TestRun } from "../../types";
import type { FailedImage } from "../../_helpers/testRunImage.helper";
import { Tooltip } from "../Tooltip";
import { TEST_ID } from "../../constants/locators";

interface TestRunInfoBarProps {
  testRun: TestRun;
  sizes: { baseline?: string; checkpoint?: string } | null;
  failedImages: FailedImage[];
  toolbar: ReactNode;
}

const VlmLine = ({ description }: { description: string }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <Stack
      direction="row"
      spacing={1}
      data-testid={TEST_ID.vlmAnalysis}
      sx={{ alignItems: expanded ? "flex-start" : "center", py: 0.5 }}
    >
      <Tooltip title="AI-generated description of the differences found by the Vision Language Model (VLM).">
        <Typography variant="caption" sx={{ fontWeight: 600, flexShrink: 0 }}>
          ✦ VLM analysis
        </Typography>
      </Tooltip>
      <Typography
        variant="body2"
        noWrap={!expanded}
        sx={{
          minWidth: 0,
          flexGrow: 1,
          whiteSpace: expanded ? "pre-wrap" : undefined,
          wordBreak: "break-word",
        }}
      >
        {description}
      </Typography>
      <Button size="small" onClick={() => setExpanded(!expanded)}>
        {expanded ? "Less" : "More"}
      </Button>
    </Stack>
  );
};

export const TestRunInfoBar = ({
  testRun,
  sizes,
  failedImages,
  toolbar,
}: TestRunInfoBarProps) => (
  <Box sx={{ mx: 1 }}>
    {testRun.vlmDescription && (
      <VlmLine key={testRun.id} description={testRun.vlmDescription} />
    )}
    {sizes && (
      <Alert severity="warning" sx={{ py: 0 }}>
        {`Image sizes differ: baseline ${sizes.baseline ?? "unknown"}, checkpoint ${sizes.checkpoint ?? "unknown"}. Cannot calculate diff.`}
      </Alert>
    )}
    {failedImages.length > 0 && (
      <Alert severity="warning" sx={{ py: 0 }}>
        {`Could not load the ${failedImages.join(" and ")} image${failedImages.length > 1 ? "s" : ""}.${testRun.baselineName ? " Image sizes cannot be compared." : ""}`}
      </Alert>
    )}
    {toolbar}
    <Divider />
  </Box>
);
