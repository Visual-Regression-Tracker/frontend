import React, { useEffect, useState } from "react";
import { Grid, Dialog } from "@material-ui/core";
import { useParams, useLocation } from "react-router-dom";
import { Build, TestRun } from "../types";
import { projectsService, buildsService, testsService } from "../services";
import BuildList from "../components/BuildList";
import ProjectSelect from "../components/ProjectSelect";
import qs from "qs";
import TestRunList from "../components/TestRunList";
import TestDetailsModal from "../components/TestDetailsModal";

const getQueryParams = (guery: string) => {
  const queryParams = qs.parse(guery, { ignoreQueryPrefix: true });
  return {
    buildId: queryParams.buildId as string,
    testId: queryParams.testId as string,
  };
};

const ProjectPage = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [selectedBuildId, setSelectedBuildId] = useState<string>();
  const [selectedTestdId, setSelectedTestId] = useState<string>();
  const [selectedTestRun, setSelectedTestRun] = useState<TestRun>();

  useEffect(() => {
    const queryParams = getQueryParams(location.search);
    if (queryParams.buildId) {
      setSelectedBuildId(queryParams.buildId);
    } else if (builds.length > 0) {
      setSelectedBuildId(builds[0].id);
    }
    if (queryParams.testId) {
      setSelectedTestId(queryParams.testId);
      const testRun = testRuns.find((t) => t.id === queryParams.testId);
      setSelectedTestRun(testRun);
    } else {
      setSelectedTestId(undefined);
      setSelectedTestRun(undefined);
    }
  }, [location.search, builds, testRuns]);

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
            {selectedTestRun && (
              <Dialog open={true} fullScreen style={{ margin: "40px" }}>
                <TestDetailsModal
                  details={selectedTestRun}
                  updateTestRun={updateTestRun}
                />
              </Dialog>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ProjectPage;
