import { SearchOff } from "@mui/icons-material";
import { EmptyState } from "./EmptyState";

export const gridEmptyState = (title: string) =>
  function NoRowsOverlay() {
    return <EmptyState dense icon={<SearchOff />} title={title} />;
  };
