import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";

export const PageHeader = ({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    spacing={2}
    sx={{
      alignItems: { xs: "flex-start", sm: "center" },
      justifyContent: "space-between",
      mb: 3,
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h4" component="h1">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {actions && (
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        {actions}
      </Stack>
    )}
  </Stack>
);
