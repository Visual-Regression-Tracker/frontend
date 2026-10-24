import React from "react";
import { IconButton } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { DarkModeOutlined, LightModeOutlined } from "@mui/icons-material";
import { Tooltip } from "../components/Tooltip";

// Flips between light and dark. Until the viewer picks one the app follows
// the system setting; the choice is kept in localStorage (vrt-color-mode).
export const ColorModeToggle: React.FunctionComponent = () => {
  const { mode, systemMode, setMode } = useColorScheme();
  const current = mode === "system" ? systemMode : mode;
  const next = current === "dark" ? "light" : "dark";

  return (
    <Tooltip title={`Switch to ${next} mode`}>
      <IconButton
        aria-label={`Switch to ${next} mode`}
        onClick={() => setMode(next)}
        data-testid="colorModeToggle"
      >
        {current === "dark" ? <LightModeOutlined /> : <DarkModeOutlined />}
      </IconButton>
    </Tooltip>
  );
};
