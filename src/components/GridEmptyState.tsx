import { SearchOff } from "@mui/icons-material";
import { EmptyState } from "./EmptyState";

export const NoMatchState = ({
  title,
  testId,
}: {
  title: string;
  testId?: string;
}) => (
  <EmptyState dense icon={<SearchOff />} title={title} data-testid={testId} />
);

export const gridEmptyState = (title: string) =>
  function NoRowsOverlay() {
    return <NoMatchState title={title} />;
  };
