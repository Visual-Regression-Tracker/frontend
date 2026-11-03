import {
  type ComponentProps,
  createContext,
  type SubmitEvent,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { TextField, type TextFieldProps } from "@mui/material";
import { firstError, type Rule } from "../_helpers/validation";

type Check = () => boolean;
type Register = (check: Check) => () => void;

const RegisterContext = createContext<Register | null>(null);

type ValidatedFormProps = Omit<ComponentProps<"form">, "onSubmit"> & {
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
};

export const ValidatedForm = ({
  onSubmit,
  children,
  ...props
}: ValidatedFormProps) => {
  const [checks] = useState(() => new Set<Check>());
  const register = useCallback<Register>(
    (check) => {
      checks.add(check);
      return () => {
        checks.delete(check);
      };
    },
    [checks],
  );

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    // every field runs, so each one shows its own error
    const results = Array.from(checks, (check) => check());
    if (results.every(Boolean)) {
      onSubmit(event);
    }
  };

  return (
    <RegisterContext value={register}>
      <form {...props} onSubmit={handleSubmit}>
        {children}
      </form>
    </RegisterContext>
  );
};

const NOT_SUBMITTED = Symbol("not submitted");

export const useFieldValidation = (
  value: unknown,
  rules: readonly Rule[],
): string | undefined => {
  const register = useContext(RegisterContext);
  const [initialValue] = useState(() => value);
  const [touched, setTouched] = useState(false);
  const [submittedValue, setSubmittedValue] = useState<unknown>(NOT_SUBMITTED);
  const latest = useRef({ value, rules });

  useLayoutEffect(() => {
    latest.current = { value, rules };
  });

  useEffect(
    () =>
      register?.(() => {
        const { value, rules } = latest.current;
        setSubmittedValue(value);
        return firstError(value, rules, true) === undefined;
      }),
    [register],
  );

  if (!touched && !Object.is(value, initialValue)) {
    setTouched(true);
  }
  // an untouched field stays quiet until the first submit
  if (submittedValue === NOT_SUBMITTED && !touched) {
    return undefined;
  }
  // a submit's required error lasts until the value changes
  return firstError(value, rules, Object.is(submittedValue, value));
};

type ValidatedTextFieldProps = TextFieldProps & {
  rules: readonly Rule[];
};

export const ValidatedTextField = ({
  rules,
  value,
  error,
  helperText,
  ...props
}: ValidatedTextFieldProps) => {
  const message = useFieldValidation(value, rules);
  return (
    <TextField
      {...props}
      value={value}
      error={message !== undefined || error}
      helperText={message ?? helperText}
    />
  );
};
