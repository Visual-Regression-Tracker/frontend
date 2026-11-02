import { useState, type ChangeEvent } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import {
  selectProject,
  useProjectDispatch,
  useProjectState,
  useUserState,
} from "../contexts";
import ProjectSelect from "./ProjectSelect";

export const ConfigurationExamples = () => {
  const { user } = useUserState();
  const projectDispatch = useProjectDispatch();
  const { selectedProjectId } = useProjectState();
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Card variant="outlined">
      <CardHeader
        title="Configuration examples"
        slotProps={{ title: { variant: "h6" } }}
      />
      <CardContent>
        <ProjectSelect
          onProjectSelect={(id) => selectProject(projectDispatch, id)}
        />
        <Tabs
          variant="fullWidth"
          value={tabIndex}
          indicatorColor="primary"
          textColor="primary"
          onChange={(_event: ChangeEvent<unknown>, newValue: number) => {
            setTabIndex(newValue);
          }}
        >
          <Tab label="Config file" />
          <Tab label="ENV variables" />
        </Tabs>
        <div role="tabpanel" hidden={tabIndex !== 0}>
          {tabIndex === 0 && (
            <Box p={3}>
              <TextField
                id="configFile"
                name="configFile"
                variant="outlined"
                disabled
                value={`{
    "apiUrl": "${window._env_.REACT_APP_API_URL}",
    "apiKey": "${user?.apiKey}",
    "project": "${selectedProjectId ?? "Default project"}",
    "branchName": "master",
    "ciBuildId": "commit_sha",
    "enableSoftAssert": false
}`}
                multiline
                rows={8}
                fullWidth
                helperText="Save as vrt.json in project root. Could be overridden with ENV variables"
              />
            </Box>
          )}
        </div>
        <div role="tabpanel" hidden={tabIndex !== 1}>
          {tabIndex === 1 && (
            <Box p={3}>
              <TextField
                id="envVariables"
                name="envVariables"
                variant="outlined"
                disabled
                value={`
  VRT_APIURL="${window._env_.REACT_APP_API_URL}"
  VRT_APIKEY="${user?.apiKey}"
  VRT_PROJECT="${selectedProjectId ?? "Default project"}"
  VRT_BRANCHNAME="master"
  VRT_CIBUILDID="commit_sha"
  VRT_ENABLESOFTASSERT=false
  `}
                multiline
                rows={8}
                fullWidth
                helperText="Add Environment variables inside CI environment"
              />
            </Box>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
