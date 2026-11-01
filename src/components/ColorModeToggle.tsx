import { IconButton } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { DarkModeOutlined, LightModeOutlined } from "@mui/icons-material";
import { Tooltip } from "./Tooltip";

export const ColorModeToggle = () => {
  const { mode, systemMode, setMode } = useColorScheme();
  const current = mode === "system" ? systemMode : mode;

  // mode is unknown until mounted; hold the place rather than show the wrong switch
  if (!current) {
    return <IconButton disabled aria-hidden sx={{ visibility: "hidden" }} />;
  }
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
