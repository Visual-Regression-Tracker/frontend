import React from "react";
import { Box, Stack, Typography } from "@mui/material";

// The title row of a page: what it is, a line of context, and its actions.
export const PageHeader: React.FunctionComponent<{
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    alignItems={{ xs: "flex-start", sm: "center" }}
    justifyContent="space-between"
    spacing={2}
    mb={3}
  >
    <Box minWidth={0}>
      <Typography variant="h4" component="h1">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
    {actions && (
      <Stack direction="row" alignItems="center" spacing={1.5}>
        {actions}
      </Stack>
    )}
  </Stack>
);
