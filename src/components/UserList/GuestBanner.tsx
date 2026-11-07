import { Alert, Button } from "@mui/material";
import { pluralize } from "../../_helpers/format.helper";

export const GuestBanner = ({
  count,
  onShow,
}: {
  count: number;
  onShow: () => void;
}) => (
  <Alert
    severity="warning"
    action={
      <Button color="inherit" size="small" onClick={onShow}>
        Show Guests
      </Button>
    }
  >
    <strong>
      {count} new {pluralize(count, "person is a Guest", "people are Guests")}.
    </strong>{" "}
    Guests can look at builds but can&apos;t approve, reject or change anything.
  </Alert>
);
