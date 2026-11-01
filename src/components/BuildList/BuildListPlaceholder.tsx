import { Typography } from "@mui/material";
import { Inbox, SearchOff } from "@mui/icons-material";
import { SkeletonList } from "../SkeletonList";
import { EmptyState } from "../EmptyState";

export const BuildListPlaceholder = ({
  loading,
  error,
  searchQuery,
}: {
  loading: boolean;
  error: unknown;
  searchQuery: string;
}) => {
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
