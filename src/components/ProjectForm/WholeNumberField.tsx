import { type ChangeEvent } from "react";
import { TextValidator } from "react-material-ui-form-validator";

interface WholeNumberFieldProps {
  name: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export const WholeNumberField = ({
  name,
  label,
  value,
  onChange,
}: WholeNumberFieldProps) => (
  <TextValidator
    name={name}
    validators={["minNumber:1"]}
    errorMessages={["Enter greater than 1"]}
    InputProps={{
      inputProps: {
        min: 1,
        step: 1,
      },
    }}
    margin="dense"
    id={name}
    label={label}
    type="number"
    fullWidth
    required
    value={value}
    onChange={(event: ChangeEvent<HTMLInputElement>) =>
      onChange(parseInt(event.target.value))
    }
  />
);
