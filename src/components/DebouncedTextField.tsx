import { useEffect, useRef, useState } from "react";
import { TextField, TextFieldProps } from "@mui/material";

type Props = Omit<TextFieldProps, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  debounceTimeout?: number;
  // shorter input is not reported while typing; deleting below it reports ""
  minLength?: number;
};

export const DebouncedTextField = ({
  value,
  onChange,
  debounceTimeout = 300,
  minLength = 0,
  onKeyDown,
  onBlur,
  ...props
}: Props) => {
  const [text, setText] = useState(value ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef<string | undefined>(undefined);
  const onChangeRef = useRef(onChange);
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

  const flush = () => {
    if (pending.current === undefined) {
      return;
    }
    cancel();
    onChangeRef.current(text);
  };

  useEffect(() => {
    if (pending.current === undefined) {
      setText(value ?? "");
    }
  }, [value]);

  useEffect(
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
