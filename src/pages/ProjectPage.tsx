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
import { useParams } from "react-router-dom";
import { Build, Test } from "../types";
import { buildsService, testsService } from "../services";
import TestDetailsModal from "./TestDetailsModal";

const ProjectPage = () => {
  const { id } = useParams();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | undefined>(undefined);
  const [selectedBuildId, setSelectedBuildId] = useState(0);

  useEffect(() => {
    const projectId = Number.parseInt(id as string);
    buildsService.getAll(projectId).then((builds) => {
      setBuilds(builds);
    });
  }, [id]);

  useEffect(() => {
    builds.length > 0 && setSelectedBuildId(builds[0].id);
  }, [builds]);

  useEffect(() => {
    if (selectedBuildId !== 0) {
      testsService.getAll(selectedBuildId).then((tests) => {
        setTests(tests);
      });
    }
  }, [selectedBuildId]);

  const handleListItemClick = (buildId: number) => {
    setSelectedBuildId(buildId);
  };

  return (
    <Grid container>
      <Grid item xs={3}>
        <List>
          {builds.map((build) => (
            <ListItem
              key={build.id}
              selected={selectedBuildId === build.id}
              button
              onClick={() => {
                handleListItemClick(build.id);
              }}
            >
              <ListItemText
                primary={`#${build.id}`}
                secondary={`Date: ${build.createdAt}`}
              />
              <Typography>Branch: {build.branchName}</Typography>
              <Typography>CreatedBy: {build.createdBy}</Typography>
              <Typography></Typography>
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
                      onClick={() => setSelectedTest(test)}
                    >
                      <TableCell>
                        <Typography>{test.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{test.os}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{test.browser}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{test.viewport}</Typography>
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

          {selectedTest && (
            <TestDetailsModal
              test={selectedTest}
              onClose={() => setSelectedTest(undefined)}
            />
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ProjectPage;
