import { Button, Stack, Typography } from "@mui/material";
import { Inbox, SearchOff } from "@mui/icons-material";
import { SkeletonList } from "../SkeletonList";
import { EmptyState } from "../EmptyState";
import { TEST_ID } from "../../constants/locators";

export const BuildListPlaceholder = ({
  loading,
  error,
  searchQuery,
  onRetry,
}: {
  loading: boolean;
  error: unknown;
  searchQuery: string;
  onRetry: () => void;
}) => {
  if (loading) {
    return <SkeletonList />;
  }
  if (error) {
    return (
      <Stack
        data-testid={TEST_ID.buildListError}
        sx={{ alignItems: "center", gap: 1, padding: 2 }}
      >
        <Typography
          variant="subtitle1"
          align="center"
          color="error"
          sx={{ overflowWrap: "anywhere" }}
        >
          Builds could not be loaded
        </Typography>
        <Button size="small" onClick={onRetry}>
          Retry
        </Button>
      </Stack>
    );
  }
  return (
    <EmptyState
      dense
      icon={searchQuery ? <SearchOff /> : <Inbox />}
      title={searchQuery ? `No builds match "${searchQuery}"` : "No builds"}
      data-testid={TEST_ID.buildListEmpty}
    />
  );
};
