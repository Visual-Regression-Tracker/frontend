import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  selectProject,
  useProjectDispatch,
  useProjectState,
  useUserState,
} from "../contexts";
import { useCopyToClipboard } from "../_helpers/useCopyToClipboard";
import ProjectSelect from "./ProjectSelect";

type Format = "config" | "env";

const FORMATS = {
  config: {
    id: "configFile",
    helperText:
      "Save as vrt.json in project root. Could be overridden with ENV variables",
  },
  env: {
    id: "envVariables",
    helperText: "Add Environment variables inside CI environment",
  },
} as const;

export const ConfigurationExamples = () => {
  const { user } = useUserState();
  const projectDispatch = useProjectDispatch();
  const { selectedProjectId } = useProjectState();
  const copy = useCopyToClipboard();
  const [format, setFormat] = useState<Format>("config");

  const apiUrl = window._env_.REACT_APP_API_URL;
  const project = selectedProjectId ?? "Default project";
  const text =
    format === "config"
      ? `{
    "apiUrl": "${apiUrl}",
    "apiKey": "${user?.apiKey}",
    "project": "${project}",
    "branchName": "master",
    "ciBuildId": "commit_sha",
    "enableSoftAssert": false
}`
      : `
  VRT_APIURL="${apiUrl}"
  VRT_APIKEY="${user?.apiKey}"
  VRT_PROJECT="${project}"
  VRT_BRANCHNAME="master"
  VRT_CIBUILDID="commit_sha"
  VRT_ENABLESOFTASSERT=false
  `;
  const { id, helperText } = FORMATS[format];

  return (
    <Card variant="outlined">
      <CardHeader
        title="Configuration examples"
        slotProps={{ title: { variant: "h6" } }}
      />
      <CardContent>
        <Stack spacing={2}>
          <Box sx={{ mx: -1 }}>
            <ProjectSelect
              variant="outlined"
              onProjectSelect={(projectId) =>
                selectProject(projectDispatch, projectId)
              }
            />
          </Box>
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <ToggleButtonGroup
              exclusive
              size="small"
              value={format}
              aria-label="Format"
              onChange={(_event, value: Format | null) =>
                value && setFormat(value)
              }
            >
              <ToggleButton value="config">Config file</ToggleButton>
              <ToggleButton value="env">ENV variables</ToggleButton>
            </ToggleButtonGroup>
            <Button
              variant="outlined"
              onClick={() =>
                copy(
                  text.trim(),
                  "Configuration copied",
                  "Could not copy the configuration",
                )
              }
            >
              Copy
            </Button>
          </Stack>
          <TextField
            key={id}
            id={id}
            name={id}
            variant="outlined"
            disabled
            value={text}
            multiline
            rows={8}
            fullWidth
            helperText={helperText}
          />
        </Stack>
      </CardContent>
    </Card>
  );
};
