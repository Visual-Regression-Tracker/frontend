import { TestRun } from "../types";

export const TAG_FIELDS: Array<keyof TestRun> = [
  "os",
  "device",
  "browser",
  "viewport",
  "customTags",
];

export const tagValuesOf = (
  run: TestRun,
  fields: Array<keyof TestRun>,
): string[] =>
  fields
    .map((field) => run[field])
    .filter((value): value is string => typeof value === "string" && !!value);

export const tagsOf = (run: TestRun, fields: Array<keyof TestRun>): string =>
  tagValuesOf(run, fields).join(" · ");
