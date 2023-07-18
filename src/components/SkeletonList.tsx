import React from "react";
import { Box } from "@mui/material";
import { Skeleton } from "@mui/lab";

export const SkeletonList: React.FunctionComponent = () => {
  const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  return (
    <Box height={1} overflow="auto">
      {list.map((i) => (
        <Box p={0.2} key={i}>
          <Skeleton variant="rectangular" height={80} />
        </Box>
      ))}
    </Box>
  );
};
