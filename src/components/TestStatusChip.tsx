import { Chip } from "@mui/material";
import { statusColor } from "../theme";

const TestStatusChip = ({ status }: { status: string | undefined }) => (
  <Chip
    variant="outlined"
    color={statusColor(status)}
    label={status}
    size="small"
  />
);

export default TestStatusChip;
