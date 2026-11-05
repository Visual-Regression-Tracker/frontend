import { Box, Stack, Typography } from "@mui/material";
import { AccountTree } from "@mui/icons-material";
import { TestVariation } from "../types";
import { TagLine } from "./TagLine";

interface IProps {
  testVariation: TestVariation;
}

export const TestVariationDetails = ({ testVariation }: IProps) => (
  <Box>
    <Typography variant="h4" component="h1" sx={{ overflowWrap: "anywhere" }}>
      {testVariation.name}
    </Typography>
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ flexWrap: "wrap", alignItems: "center", mt: 0.5 }}
    >
      <Stack
        direction="row"
        spacing={0.5}
        sx={{ alignItems: "center", color: "text.secondary" }}
      >
        <AccountTree sx={{ fontSize: 16 }} />
        <Typography variant="body2">{testVariation.branchName}</Typography>
      </Stack>
      <TagLine tags={testVariation} />
    </Stack>
  </Box>
);
