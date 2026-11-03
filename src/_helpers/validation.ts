export interface Rule {
  isValid: (value: unknown) => boolean;
  message: string;
  // an empty required field is pointed out on submit, not while typing
  onSubmitOnly?: boolean;
}

const isEmpty = (value: unknown) =>
  value === undefined || value === null || value === "";

const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export const required = (message: string): Rule => ({
  isValid: (value) => !isEmpty(value),
  message,
  onSubmitOnly: true,
});

export const minLength = (length: number, message: string): Rule => ({
  isValid: (value) => typeof value === "string" && value.length >= length,
  message,
});

export const AT_LEAST_TWO_CHARACTERS: readonly Rule[] = [
  minLength(2, "Enter at least two characters."),
];

export const isEmail = (message: string): Rule => ({
  isValid: (value) =>
    isEmpty(value) || (typeof value === "string" && EMAIL.test(value)),
  message,
});

export const min = (limit: number, message: string): Rule => ({
  isValid: (value) => isEmpty(value) || Number(value) >= limit,
  message,
});

export const max = (limit: number, message: string): Rule => ({
  isValid: (value) => isEmpty(value) || Number(value) <= limit,
  message,
});

export const firstError = (
  value: unknown,
  rules: readonly Rule[],
  submitting: boolean,
): string | undefined =>
  rules.find(
    (rule) => (submitting || !rule.onSubmitOnly) && !rule.isValid(value),
  )?.message;
