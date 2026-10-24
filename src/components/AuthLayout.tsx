import React from "react";
import { Box, Typography } from "@mui/material";
import logo from "../static/logo.png";

// The frame of the signed-out pages: the product mark above one card.
export const AuthLayout: React.FunctionComponent<{
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <Box
    sx={{
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      px: 2,
      py: 6,
      background: (theme) =>
        `radial-gradient(1200px 500px at 50% -10%, rgba(${theme.vars?.palette.primary.mainChannel} / 0.12), transparent)`,
    }}
  >
    <Box sx={{ width: "100%", maxWidth: 400 }}>
      <Box textAlign="center" mb={3}>
        <img src={logo} width="72" height="72" alt="" />
        <Typography variant="h5" component="h1" mt={1.5}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {subtitle}
        </Typography>
      </Box>
      {children}
    </Box>
  </Box>
);
