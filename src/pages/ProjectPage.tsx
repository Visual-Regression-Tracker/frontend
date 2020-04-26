import React, { useEffect, useState } from "react";
import {
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  TableContainer,
  TableHead,
  TableCell,
  Table,
  TableRow,
  TableBody,
} from "@material-ui/core";
import { useParams, useHistory } from "react-router-dom";
import { Build, TestRun } from "../types";
import { projectsService, buildsService } from "../services";
import { routes } from "../constants";

const ProjectPage = () => {
  const history = useHistory();
  const { projectId } = useParams();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [tests, setTests] = useState<TestRun[]>([]);
  const [selectedBuildId, setSelectedBuildId] = useState<string>();

  useEffect(() => {
    if (projectId) {
      projectsService.getDetails(projectId).then((project) => {
        setBuilds(project.builds);
      });
    }
  }, [projectId]);

  useEffect(() => {
    builds.length > 0 && setSelectedBuildId(builds[0].id);
  }, [builds]);

  useEffect(() => {
    if (selectedBuildId) {
      buildsService.getTestRuns(selectedBuildId).then((testRuns: TestRun[]) => {
        setTests(testRuns);
      });
    }
  }, [selectedBuildId]);

  return (
    <Grid container>
      <Grid item xs={3}>
        <List>
          {builds.map((build) => (
            <ListItem
              key={build.id}
              selected={selectedBuildId === build.id}
              button
              onClick={() => setSelectedBuildId(build.id)}
            >
              <ListItemText
                primary={`#${build.id}`}
                secondary={`Date: ${build.createdAt}`}
              />
              <Typography>Branch: {build.branchName}</Typography>
            </ListItem>
          ))}
        </List>
      </Grid>
      <Grid item xs={9}>
        <Grid container direction="column">
          <Grid item>Pannel</Grid>
          <Grid item>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>OS</TableCell>
                    <TableCell>Browser</TableCell>
                    <TableCell>Viewport</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tests.map((test) => (
                    <TableRow
                      key={test.id}
                      hover
                      onClick={() =>
                        history.push(`${routes.TEST_DETAILS_PAGE}/${test.id}`)
                      }
                    >
                      <TableCell>
                        <Typography>{test.testVariation.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{test.testVariation.os}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{test.testVariation.browser}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{test.testVariation.viewport}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{test.status}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ProjectPage;
