import React from "react";
import { Box, Typography } from "@mui/material";

export const ProjectGrid: React.FunctionComponent<{
  children: React.ReactNode;
}> = ({ children }) => (
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

// a titled run of cards: favourites, recently opened, the rest
export const ProjectSection: React.FunctionComponent<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
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
