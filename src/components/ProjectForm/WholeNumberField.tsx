import { type ChangeEvent } from "react";
import { ValidatedTextField } from "../ValidatedForm";
import { atLeast } from "./rules";

const LOWEST = 1;
const WHOLE_NUMBER_RULES = [atLeast(LOWEST)];

interface WholeNumberFieldProps {
  name: string;
  value: number;
  onChange: (value: number) => void;
}

export const WholeNumberField = ({
  name,
  value,
  onChange,
}: WholeNumberFieldProps) => (
  <ValidatedTextField
    name={name}
    rules={WHOLE_NUMBER_RULES}
    slotProps={{
      htmlInput: { min: LOWEST, step: 1 },
    }}
    size="small"
    id={name}
    type="number"
    fullWidth
    required
    value={value}
    onChange={(event: ChangeEvent<HTMLInputElement>) =>
      onChange(parseInt(event.target.value))
    }
  />
);
