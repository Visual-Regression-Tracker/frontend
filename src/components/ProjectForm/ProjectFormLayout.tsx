import type { ReactNode } from "react";
import { Box, Stack } from "@mui/material";
import { ProjectForm } from "./ProjectForm";
import { SectionNav } from "./SectionNav";

export const ProjectFormLayout = ({ actions }: { actions: ReactNode }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: { md: "180px minmax(0, 1fr)" },
      gap: 2,
    }}
  >
    <SectionNav />
    <Stack spacing={2}>
      <ProjectForm />
      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
        {actions}
      </Stack>
    </Stack>
  </Box>
);
