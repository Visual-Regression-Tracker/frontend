import type { ReactNode } from "react";
import { Box } from "@mui/material";

export const HotkeyHint = ({ children }: { children: ReactNode }) => (
  <Box
    component="kbd"
    aria-hidden
    sx={{
      ml: 0.75,
      px: 0.5,
      border: 1,
      borderColor: "divider",
      borderRadius: 0.5,
      fontFamily: "inherit",
      fontSize: "0.7rem",
      lineHeight: 1.5,
      opacity: 0.8,
    }}
  >
    {children}
  </Box>
);
