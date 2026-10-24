import React from "react";
import { Box, Typography } from "@mui/material";

// What a list or panel shows when it has nothing to show, and why.
export const EmptyState: React.FunctionComponent<{
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  // a narrow panel (the build list) gets a smaller icon and less air
  dense?: boolean;
  "data-testid"?: string;
}> = ({ icon, title, description, action, dense, ...props }) => (
  <Box
    data-testid={props["data-testid"]}
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: 1,
      px: 2,
      py: dense ? 3 : 8,
      overflowWrap: "anywhere",
    }}
  >
    <Box
      aria-hidden
      sx={{
        display: "grid",
        placeItems: "center",
        width: dense ? 40 : 56,
        height: dense ? 40 : 56,
        mb: 0.5,
        borderRadius: "50%",
        color: "primary.main",
        bgcolor: (theme) =>
          `rgba(${theme.vars?.palette.primary.mainChannel} / 0.1)`,
        "& svg": { fontSize: dense ? 22 : 28 },
      }}
    >
      {icon}
    </Box>
    <Typography variant={dense ? "subtitle2" : "subtitle1"}>{title}</Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" maxWidth={420}>
        {description}
      </Typography>
    )}
    {action && <Box mt={1}>{action}</Box>}
  </Box>
);
