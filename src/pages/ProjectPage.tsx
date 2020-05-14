import React, { useEffect, useState } from "react";
import { Grid, Dialog, IconButton } from "@material-ui/core";
import { useParams, useLocation, useHistory } from "react-router-dom";
import { Build, TestRun } from "../types";
import { projectsService, buildsService, testsService } from "../services";
import BuildList from "../components/BuildList";
import ProjectSelect from "../components/ProjectSelect";
import qs from "qs";
import TestRunList from "../components/TestRunList";
import TestDetailsModal from "../components/TestDetailsModal";
import { NavigateBefore, NavigateNext } from "@material-ui/icons";

const getQueryParams = (guery: string) => {
  const queryParams = qs.parse(guery, { ignoreQueryPrefix: true });
  return {
    buildId: queryParams.buildId as string,
    testId: queryParams.testId as string,
  };
};

const styles: {
  modal: React.CSSProperties;
  button: React.CSSProperties;
  icon: React.CSSProperties;
} = {
  modal: {
    margin: 40,
  },
  button: {
    width: 64,
    height: 64,
    padding: 0,
    position: "fixed",
    top: "50%",
    zIndex: 4000,
  },
  icon: {
    width: 64,
    height: 64,
  },
};

const ProjectPage = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const history = useHistory();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [selectedBuildId, setSelectedBuildId] = useState<string>();
  const [selectedTestdId, setSelectedTestId] = useState<string>();
  const [selectedTestRunIndex, setSelectedTestRunIndex] = useState<number>();

  useEffect(() => {
    const queryParams = getQueryParams(location.search);
    if (queryParams.buildId) {
      setSelectedBuildId(queryParams.buildId);
    } else if (builds.length > 0) {
      setSelectedBuildId(builds[0].id);
    }
    if (queryParams.testId) {
      setSelectedTestId(queryParams.testId);
      const index = testRuns.findIndex((t) => t.id === queryParams.testId);
      setSelectedTestRunIndex(index);
    } else {
      setSelectedTestId(undefined);
      setSelectedTestRunIndex(undefined);
    }
  }, [location.search, builds, testRuns, selectedTestRunIndex]);

  useEffect(() => {
    if (projectId) {
      projectsService.getBuilds(projectId).then((builds) => setBuilds(builds));
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedBuildId) {
      buildsService.getTestRuns(selectedBuildId).then((testRuns: TestRun[]) => {
        setTestRuns(testRuns);
      });
    }
  }, [selectedBuildId]);

  const updateTestRun = (testRun: TestRun) => {
    const updated = testRuns.map((t) => {
      if (t.id === testRun.id) {
        return testRun;
      }
      return t;
    });
    setTestRuns(updated);
  };

  return (
    <Grid container>
      <Grid item xs={3}>
        <Grid container direction="column">
          <Grid item>
            <ProjectSelect selectedId={projectId} />
          </Grid>
        </Grid>
        <Grid item>
          <BuildList
            builds={builds}
            setBuilds={setBuilds}
            selectedBuildId={selectedBuildId}
          />
        </Grid>
      </Grid>
      <Grid item xs={9}>
        <Grid container direction="column">
          <Grid item>Pannel</Grid>
          <Grid item>
            <TestRunList
              items={testRuns}
              selectedId={selectedTestdId}
              handleRemove={(id: string) =>
                testsService.remove(id).then((isRemoved) => {
                  if (isRemoved) {
                    setTestRuns(testRuns.filter((item) => item.id !== id));
                  }
                })
              }
            />
            {selectedTestRunIndex !== undefined &&
              testRuns[selectedTestRunIndex] && (
                <Dialog open={true} fullScreen style={styles.modal}>
                  <TestDetailsModal
                    details={testRuns[selectedTestRunIndex]}
                    updateTestRun={updateTestRun}
                  />
                  {selectedTestRunIndex + 1 < testRuns.length && (
                    <IconButton
                      color="secondary"
                      style={{
                        ...styles.button,
                        right: 0,
                      }}
                      onClick={() => {
                        const next = testRuns[selectedTestRunIndex + 1];
                        history.push({
                          search: `buildId=${next.buildId}&testId=${next.id}`,
                        });
                      }}
                    >
                      <NavigateNext style={styles.icon} />
                    </IconButton>
                  )}
                  {selectedTestRunIndex > 0 && (
                    <IconButton
                      color="secondary"
                      style={{
                        ...styles.button,
                        left: 0,
                      }}
                      onClick={() => {
                        const prev = testRuns[selectedTestRunIndex - 1];
                        history.push({
                          search: `buildId=${prev.buildId}&testId=${prev.id}`,
                        });
                      }}
                    >
                      <NavigateBefore style={styles.icon} />
                    </IconButton>
                  )}
                </Dialog>
              )}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ProjectPage;
