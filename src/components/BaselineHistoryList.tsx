import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import { Baseline } from "../types/baseline";
import { StatusChip } from "./StatusChip";
import { DateLabel } from "./DateLabel";
import { Tooltip } from "./Tooltip";
import { NoiseHintChip } from "./TestRunList/NoiseHintChip";

interface IProps {
  baselines: Baseline[];
  noiseAvailable: boolean;
  onSelect: (baseline: Baseline) => void;
  onOpenTestRun: (baseline: Baseline) => void;
}

export const versionNumber = (total: number, index: number) => total - index;

export const baselineElementId = (baseline: Baseline) =>
  `baseline-${baseline.id}`;

export const BaselineHistoryList = ({
  baselines,
  noiseAvailable,
  onSelect,
  onOpenTestRun,
}: IProps) => (
  <Stack component="ul" spacing={1} sx={{ listStyle: "none", m: 0, p: 0 }}>
    {baselines.map((baseline, index) => {
      const { user, testRun } = baseline;
      const version = versionNumber(baselines.length, index);
      return (
        <Box
          component="li"
          key={baseline.id}
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            bgcolor: "background.paper",
          }}
        >
          <Stack
            direction="row"
            component="button"
            type="button"
            onClick={() => onSelect(baseline)}
            aria-label={`Show version ${version}`}
            spacing={1.5}
            sx={{
              all: "unset",
              boxSizing: "border-box",
              width: "100%",
              cursor: "pointer",
              alignItems: "center",
              px: 1.5,
              py: 1,
              "&:focus-visible": { outline: 2, outlineColor: "primary.main" },
            }}
          >
            {user && (
              <Tooltip title={user.email}>
                <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                  {`${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`}
                </Avatar>
              </Tooltip>
            )}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" noWrap>
                {`v${version}`}
                {user && ` · ${user.firstName} ${user.lastName}`}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                <DateLabel date={baseline.createdAt} />
              </Typography>
            </Box>
          </Stack>
          {testRun && (
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", px: 1.5, pb: 1 }}
            >
              <StatusChip status={testRun.status} />
              {noiseAvailable && <NoiseHintChip run={testRun} />}
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={() => onOpenTestRun(baseline)}>
                Test run
              </Button>
            </Stack>
          )}
        </Box>
      );
    })}
  </Stack>
);
