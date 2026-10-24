import React from "react";
import { Typography } from "@mui/material";
import { Inbox, SearchOff } from "@mui/icons-material";
import { SkeletonList } from "../SkeletonList";
import { EmptyState } from "../EmptyState";

// What the build list shows while it has no builds to list: loading, a
// failed load, or an empty (or empty-searched) project.
export const BuildListPlaceholder: React.FunctionComponent<{
  loading: boolean;
  error: unknown;
  searchQuery: string;
}> = ({ loading, error, searchQuery }) => {
  if (loading) {
    return <SkeletonList />;
  }
  if (error) {
    return (
      <Typography
        variant="subtitle1"
        align="center"
        color="error"
        sx={{ padding: 2, overflowWrap: "anywhere" }}
        data-testid="buildListError"
      >
        Builds could not be loaded
      </Typography>
    );
  }
  return (
    <EmptyState
      dense
      icon={searchQuery ? <SearchOff /> : <Inbox />}
      title={searchQuery ? `No builds match "${searchQuery}"` : "No builds"}
      data-testid="buildListEmpty"
    />
  );
};
