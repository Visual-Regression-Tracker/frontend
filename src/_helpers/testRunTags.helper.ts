import { TagField, TestRun } from "../types";

export const TAG_FIELDS: TagField[] = [
  "os",
  "device",
  "browser",
  "viewport",
  "customTags",
];

export const tagValuesOf = (run: TestRun, fields: TagField[]): string[] =>
  fields
    .map((field) => run[field])
    .filter((value): value is string => typeof value === "string" && !!value);

export const tagsOf = (run: TestRun, fields: TagField[]): string =>
  tagValuesOf(run, fields).join(" · ");

export const runLabel = (run: TestRun): string => {
  const tags = tagsOf(run, TAG_FIELDS);
  return tags ? `${run.name} (${tags})` : run.name;
};

export const TAG_LABELS: Record<TagField, string> = {
  os: "OS",
  device: "Device",
  browser: "Browser",
  viewport: "Viewport",
  customTags: "Custom tags",
};
