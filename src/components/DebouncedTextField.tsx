import React from "react";
import { TextField, TextFieldProps } from "@mui/material";

type Props = Omit<TextFieldProps, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  debounceTimeout?: number;
  // shorter input is not reported while typing; deleting below it reports ""
  minLength?: number;
};

// A text field that reports what was typed once typing pauses. Enter and
// blur report a pending change at once, and a value set from outside (a
// filter reset) replaces what is shown unless a change is still pending.
export const DebouncedTextField: React.FunctionComponent<Props> = ({
  value,
  onChange,
  debounceTimeout = 300,
  minLength = 0,
  onKeyDown,
  onBlur,
  ...props
}) => {
  const [text, setText] = React.useState(value ?? "");
  const timer = React.useRef<ReturnType<typeof setTimeout>>();
  const pending = React.useRef<string | undefined>(undefined);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  const cancel = () => {
    clearTimeout(timer.current);
    pending.current = undefined;
  };

  const schedule = (next: string) => {
    clearTimeout(timer.current);
    pending.current = next;
    timer.current = setTimeout(() => {
      pending.current = undefined;
      onChangeRef.current(next);
    }, debounceTimeout);
  };

  // report a pending change now, with what the field shows
  const flush = () => {
    if (pending.current === undefined) {
      return;
    }
    cancel();
    onChangeRef.current(text);
  };

  React.useEffect(() => {
    if (pending.current === undefined) {
      setText(value ?? "");
    }
  }, [value]);

  // a change still waiting when the field goes away is not lost
  React.useEffect(
    () => () => {
      if (pending.current !== undefined) {
        clearTimeout(timer.current);
        onChangeRef.current(pending.current);
      }
    },
    [],
  );

  return (
    <TextField
      {...props}
      value={text}
      onChange={(event) => {
        const next = event.target.value;
        if (next.length >= minLength) {
          schedule(next);
        } else if (next.length < text.length) {
          schedule("");
        }
        setText(next);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          flush();
        }
        onKeyDown?.(event);
      }}
      onBlur={(event) => {
        flush();
        onBlur?.(event);
      }}
    />
  );
};
