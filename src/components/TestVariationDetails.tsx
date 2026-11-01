import { Box, Chip, Stack, Typography } from "@mui/material";
import { AccountTree } from "@mui/icons-material";
import { TestVariation } from "../types";

interface IProps {
  testVariation: TestVariation;
}

export const TestVariationDetails = ({ testVariation }: IProps) => {
  const tags: [string, string | undefined][] = [
    ["OS", testVariation.os],
    ["Device", testVariation.device],
    ["Browser", testVariation.browser],
    ["Viewport", testVariation.viewport],
    ["Custom Tags", testVariation.customTags],
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ overflowWrap: "anywhere" }}>
        {testVariation.name}
      </Typography>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1} mt={1}>
        <Chip
          size="small"
          variant="outlined"
          icon={<AccountTree />}
          label={testVariation.branchName}
        />
        {tags
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <Chip key={label} size="small" label={`${label}: ${value}`} />
          ))}
      </Stack>
    </Box>
  );
};
