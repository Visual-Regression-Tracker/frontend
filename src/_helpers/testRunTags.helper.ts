import { TestRun } from "../types";

/**
 * The run's tag values, one entry each, in field order. The cards render them
 * separately so a single tag can be clicked.
 */
export const tagValuesOf = (
  run: TestRun,
  fields: Array<keyof TestRun>,
): string[] =>
  fields
    .map((field) => run[field])
    .filter((value): value is string => typeof value === "string" && !!value);

/**
 * The run's tag values in one string. Shared so the cards, the table column and
 * the grid's tag sorting all describe a run's tags the same way.
 */
export const tagsOf = (run: TestRun, fields: Array<keyof TestRun>): string =>
  tagValuesOf(run, fields).join(" · ");
