import { Fragment } from "react";
import { Typography } from "@mui/material";
import type { TagField } from "../types";
import {
  TAG_FIELDS,
  TAG_LABELS,
  tagItemsOf,
} from "../_helpers/testRunTags.helper";
import { Tooltip } from "./Tooltip";

interface IProps {
  tags: Partial<Record<TagField, string | null | undefined>>;
}

export const TagLine = ({ tags }: IProps) => {
  const present = TAG_FIELDS.flatMap((field) =>
    tagItemsOf(tags[field], field).map((value) => ({ field, value })),
  );
  if (present.length === 0) {
    return null;
  }
  return (
    <Typography variant="caption" sx={{ color: "text.secondary" }}>
      {present.map(({ field, value }, index) => (
        <Fragment key={`${field}-${value}`}>
          {index > 0 && " · "}
          <Tooltip title={TAG_LABELS[field]}>
            <span>{value}</span>
          </Tooltip>
        </Fragment>
      ))}
    </Typography>
  );
};
