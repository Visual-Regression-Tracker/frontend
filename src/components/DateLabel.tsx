import { formatDateTime, formatShortDate } from "../_helpers/format.helper";
import { Tooltip } from "./Tooltip";

export const DateLabel = ({ date }: { date: string }) => (
  <Tooltip title={formatDateTime(date)}>
    <span>{formatShortDate(date)}</span>
  </Tooltip>
);
