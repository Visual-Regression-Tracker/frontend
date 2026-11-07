import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { regenerateApiKey, useUserDispatch, useUserState } from "../contexts";
import { useCopyToClipboard } from "../_helpers/useCopyToClipboard";
import { monoFontFamily } from "../theme/tokens";
import { BaseModal } from "./BaseModal";

export const ApiKeyCard = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useUserState();
  const userDispatch = useUserDispatch();
  const copy = useCopyToClipboard();
  const [confirming, setConfirming] = useState(false);

  const handleRegenerate = () =>
    regenerateApiKey(userDispatch).then(
      () => {
        setConfirming(false);
        enqueueSnackbar("API key regenerated", { variant: "success" });
      },
      (err: string) => enqueueSnackbar(err, { variant: "error" }),
    );

  return (
    <Card variant="outlined">
      <CardHeader title="API key" slotProps={{ title: { variant: "h6" } }} />
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <TextField
              fullWidth
              size="small"
              value={user?.apiKey ?? ""}
              slotProps={{
                htmlInput: {
                  readOnly: true,
                  "aria-label": "API key",
                  "data-testid": "apiKey",
                },
                input: {
                  sx: {
                    fontFamily: monoFontFamily,
                  },
                },
              }}
            />
            <Button
              variant="outlined"
              sx={{ flexShrink: 0 }}
              onClick={() =>
                copy(
                  user?.apiKey ?? "",
                  "API key copied",
                  "Could not copy the API key",
                )
              }
            >
              Copy
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setConfirming(true)}
              sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
            >
              Regenerate…
            </Button>
          </Stack>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Regenerate asks first: CI jobs using the old key stop working.
          </Typography>
        </Stack>
      </CardContent>
      <BaseModal
        open={confirming}
        title="Regenerate API key"
        content="CI jobs that use the current key stop working until you give them the new one."
        submitButtonText="Regenerate"
        submitColor="error"
        onSubmit={handleRegenerate}
        onCancel={() => setConfirming(false)}
      />
    </Card>
  );
};
