import { useEffect, useRef } from "react";
import { Box, InputAdornment, TextField } from "@mui/material";
import { Search } from "@mui/icons-material";
import { Tooltip } from "./Tooltip";
import { isTypingTarget } from "../_helpers/hotkeys.helper";

export const ProjectSearchField = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key === "/" && !isTypingTarget(event.target)) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", focusSearch);
    return () => document.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <TextField
      type="search"
      size="small"
      placeholder="Search projects"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      inputRef={inputRef}
      sx={{ flex: 1, minWidth: { sm: 280 } }}
      slotProps={{
        htmlInput: { "aria-label": "Search projects" },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: value ? undefined : (
            <InputAdornment position="end">
              <Tooltip title="Press / to search">
                <Box
                  component="kbd"
                  role="img"
                  sx={{
                    px: 0.75,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 0.5,
                    color: "text.secondary",
                    fontFamily: "monospace",
                    fontSize: 12,
                  }}
                >
                  /
                </Box>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};
