import React from "react";
import { InputAdornment, TextField } from "@mui/material";
import { Search } from "@mui/icons-material";
import { isTypingTarget } from "../_helpers/hotkeys.helper";

// "/" puts the cursor here, as on GitHub and in most docs
export const ProjectSearchField: React.FunctionComponent<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
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
        },
      }}
    />
  );
};
