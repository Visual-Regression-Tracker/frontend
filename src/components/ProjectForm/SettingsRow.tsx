import { type ReactNode, useId } from "react";
import { Box, Paper, Stack, Switch, Typography } from "@mui/material";

export const settingsSectionId = (id: string) => `settings-${id}`;

interface SettingsSectionProps {
  id: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

export const SettingsSection = ({
  id,
  title,
  description,
  action,
  children,
}: SettingsSectionProps) => (
  <Paper
    component="section"
    variant="outlined"
    id={settingsSectionId(id)}
    aria-labelledby={`${settingsSectionId(id)}-title`}
    sx={{ p: 2, scrollMarginTop: 16 }}
  >
    <Stack
      direction="row"
      spacing={2}
      sx={{ alignItems: "center", justifyContent: "space-between" }}
    >
      <Typography
        id={`${settingsSectionId(id)}-title`}
        variant="h6"
        component="h3"
      >
        {title}
      </Typography>
      {action}
    </Stack>
    {description && (
      <Typography
        variant="body2"
        component="div"
        sx={{ color: "text.secondary" }}
      >
        {description}
      </Typography>
    )}
    {children}
  </Paper>
);

const rowSx = {
  py: 1.5,
  borderTop: 1,
  borderColor: "divider",
  gap: 2,
} as const;

const Describe = ({ id, children }: { id: string; children: ReactNode }) => (
  <Typography
    id={id}
    variant="caption"
    component="div"
    sx={{ color: "text.secondary" }}
  >
    {children}
  </Typography>
);

interface ToggleRowProps {
  title: string;
  description?: ReactNode;
  name: string;
  checked?: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  children?: ReactNode;
}

export const ToggleRow = ({
  title,
  description,
  name,
  checked,
  disabled,
  onChange,
  children,
}: ToggleRowProps) => {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      sx={{ ...rowSx, alignItems: { sm: "flex-start" } }}
    >
      <Stack direction="row" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
        <Switch
          checked={checked}
          disabled={disabled}
          onChange={(_event, value) => onChange(value)}
          color="primary"
          name={name}
          sx={{ flex: "none" }}
          slotProps={{
            input: {
              "aria-labelledby": titleId,
              "aria-describedby": description ? descriptionId : undefined,
            },
          }}
        />
        <Box sx={{ minWidth: 0, alignSelf: "center" }}>
          <Typography
            id={titleId}
            variant="subtitle2"
            sx={{ color: disabled ? "text.disabled" : undefined }}
          >
            {title}
          </Typography>
          {description && <Describe id={descriptionId}>{description}</Describe>}
        </Box>
      </Stack>
      {children}
    </Stack>
  );
};

interface FieldRowProps {
  id: string;
  title: string;
  description?: ReactNode;
  stacked?: boolean;
  width?: number;
  children: ReactNode;
}

export const fieldLabelId = (id: string) => `${id}-label`;

export const FieldRow = ({
  id,
  title,
  description,
  stacked,
  width = 160,
  children,
}: FieldRowProps) => (
  <Stack
    direction={{ xs: "column", sm: stacked ? "column" : "row" }}
    sx={{ ...rowSx, alignItems: { sm: stacked ? "stretch" : "flex-start" } }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        id={fieldLabelId(id)}
        component="label"
        htmlFor={id}
        variant="subtitle2"
        sx={{ display: "block" }}
      >
        {title}
      </Typography>
      {description && (
        <Describe id={`${id}-description`}>{description}</Describe>
      )}
    </Box>
    <Box sx={{ width: stacked ? "100%" : { xs: "100%", sm: width } }}>
      {children}
    </Box>
  </Stack>
);
