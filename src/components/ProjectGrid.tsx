import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

export const ProjectGrid = ({ children }: { children: ReactNode }) => (
  <Box
    sx={{
      display: "grid",
      gap: 2,
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    }}
  >
    {children}
  </Box>
);

export const ProjectSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  const headingId = `project-section-${title.toLowerCase().replace(/\W+/g, "-")}`;

  return (
    <Box component="section" aria-labelledby={headingId}>
      <Typography
        id={headingId}
        variant="subtitle2"
        component="h2"
        color="text.secondary"
        mb={1.5}
      >
        {title}
      </Typography>
      <ProjectGrid>{children}</ProjectGrid>
    </Box>
  );
};
