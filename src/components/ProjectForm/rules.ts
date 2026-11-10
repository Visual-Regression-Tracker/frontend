import { max, min, required } from "../../_helpers/validation";

export const atLeast = (limit: number) =>
  min(limit, `Enter greater than or equal to ${limit}`);

const atMost = (limit: number) =>
  max(limit, `Enter less than or equal to ${limit}`);

export const UNIT_RANGE = { min: 0, max: 1 } as const;

export const UNIT_RANGE_RULES = [
  atLeast(UNIT_RANGE.min),
  atMost(UNIT_RANGE.max),
];

export const MODEL_RULES = [required("Model is required")];
