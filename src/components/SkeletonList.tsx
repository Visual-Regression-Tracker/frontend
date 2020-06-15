import React from "react";
import { Box } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";

export const SkeletonList: React.FunctionComponent = () => {
  return (
    <React.Fragment>
      {[...Array(9)].map((i) => (
        <Box p={0.5}>
          <Skeleton variant="rect" height={80} />
        </Box>
      ))}
    </React.Fragment>
  );
};
