import React, { useEffect, useState } from "react";
import {
  Grid,
  Typography,
  TableContainer,
  TableHead,
  TableCell,
  Table,
  TableRow,
  TableBody,
  IconButton,
  Menu,
  MenuItem,
} from "@material-ui/core";
import { MoreVert } from "@material-ui/icons";
import { useParams, useHistory } from "react-router-dom";
import { Build, TestRun } from "../types";
import { projectsService, buildsService, testsService } from "../services";
import { routes } from "../constants";
import BuildList from "../components/BuildList";

const ProjectPage = () => {
  const history = useHistory();
  const { projectId } = useParams();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [tests, setTests] = useState<TestRun[]>([]);
  const [selectedBuildId, setSelectedBuildId] = useState<string>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
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

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Grid container>
      <Grid item xs={3}>
        <BuildList
          builds={builds}
          setBuilds={setBuilds}
          selectedBuildId={selectedBuildId}
          setSelectedBuildId={setSelectedBuildId}
        />
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
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tests.map((test) => (
                    <TableRow key={test.id} hover>
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
                      <TableCell>
                        <IconButton onClick={handleClick}>
                          <MoreVert />
                        </IconButton>
                        <Menu
                          anchorEl={anchorEl}
                          open={open}
                          onClose={handleClose}
                        >
                          <MenuItem
                            onClick={() =>
                              history.push(
                                `${routes.TEST_DETAILS_PAGE}/${test.id}`
                              )
                            }
                          >
                            Details
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              testsService.remove(test.id).then((isRemoved) => {
                                if (isRemoved) {
                                  setTests(
                                    tests.filter((item) => item.id !== test.id)
                                  );
                                }
                                handleClose();
                              });
                            }}
                          >
                            Delete
                          </MenuItem>
                        </Menu>
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
