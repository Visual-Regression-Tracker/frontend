import { TagField, TestRun } from "../types";

export const TAG_FIELDS: TagField[] = [
  "os",
  "device",
  "browser",
  "viewport",
  "customTags",
];

// Custom tags arrive as one free-text string, so the UI splits it. The backend
// keeps the string whole as part of a variation's identity and never parses it.
export const CUSTOM_TAG_DELIMITER = ",";

export const splitTags = (value: string | null | undefined): string[] =>
  Array.from(
    new Set(
      (value ?? "")
        .split(CUSTOM_TAG_DELIMITER)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );

/** The separate tags a field holds: custom tags are split, any other field is one tag. */
export const tagItemsOf = (
  value: string | null | undefined,
  field: string,
): string[] => {
  if (field === "customTags") {
    return splitTags(value);
  }
  return value ? [value] : [];
};

export const tagValuesOf = (run: TestRun, fields: TagField[]): string[] =>
  fields.flatMap((field) => tagItemsOf(run[field], field));

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
