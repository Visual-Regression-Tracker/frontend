import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";

export const PageToolbar = ({
  summary,
  children,
}: {
  summary?: ReactNode;
  children?: ReactNode;
}) => (
  <Stack
    direction="row"
    spacing={2}
    sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1, mb: 3 }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    {summary && (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {summary}
      </Typography>
    )}
  </Stack>
);
