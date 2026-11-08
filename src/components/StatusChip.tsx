import { Box, Chip } from "@mui/material";
import { statusColor } from "../theme";
import { statusLabel } from "../_helpers/statusLabel.helper";

type StatusChipVariant = "outlined" | "dot" | "filled";

interface IProps {
  status: string | undefined;
  variant?: StatusChipVariant;
}

export const StatusChip = ({ status, variant = "outlined" }: IProps) => {
  const color = statusColor(status);
  if (variant === "dot") {
    return (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          fontSize: "0.8125rem",
        }}
      >
        <Box
          component="span"
          data-testid="status-dot"
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: color === "default" ? "text.disabled" : `${color}.main`,
          }}
        />
        {statusLabel(status)}
      </Box>
    );
  }
  return (
    <Chip
      variant={variant}
      color={color}
      label={statusLabel(status)}
      size="small"
    />
  );
};
