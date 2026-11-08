import { type ReactNode, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, MenuItem, Paper, TextField } from "@mui/material";
import { BarChartOutlined, SearchOff } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { useProjectState } from "../contexts";
import { EmptyState } from "../components/EmptyState";
import { PageContainer } from "../components/PageContainer";
import { PageToolbar } from "../components/PageToolbar";
import { ResultsChart } from "../components/ResultsChart";
import { SkeletonList } from "../components/SkeletonList";
import { statisticsService, testVariationService } from "../services";
import { BuildResult } from "../types";
import { pluralize } from "../_helpers/format.helper";

const FEW_BUILDS = 3;

const ProjectStatistics = ({ projectId }: { projectId: string }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { projectList, loading: projectsLoading } = useProjectState();
  const project = projectList.find((item) => item.id === projectId);
  const [branchName, setBranchName] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [loaded, setLoaded] = useState<{
    key: string;
    builds: BuildResult[];
  }>();
  const key = `${projectId}/${branchName}`;
  const results = loaded?.key === key ? loaded.builds : undefined;

  useEffect(() => {
    let current = true;
    testVariationService
      .getList(projectId)
      .then((variations) => {
        if (current) {
          setBranches(
            [...new Set(variations.map((item) => item.branchName))]
              .filter(Boolean)
              .sort((a, b) => a.localeCompare(b)),
          );
        }
      })
      .catch((err: string) => enqueueSnackbar(err, { variant: "error" }));
    return () => {
      current = false;
    };
  }, [projectId, enqueueSnackbar]);

  useEffect(() => {
    let current = true;
    statisticsService
      .getResults(projectId, branchName || undefined)
      .then((builds) => current && setLoaded({ key, builds }))
      .catch((err: string) => {
        if (current) {
          setLoaded({ key, builds: [] });
          enqueueSnackbar(err, { variant: "error" });
        }
      });
    return () => {
      current = false;
    };
  }, [projectId, branchName, key, enqueueSnackbar]);

  if (!project && !projectsLoading) {
    return (
      <PageContainer>
        <EmptyState
          icon={<SearchOff />}
          title="Project not found"
          description="It may have been deleted, or the link is wrong."
        />
      </PageContainer>
    );
  }

  const subtitle =
    results &&
    project &&
    `${results.length} ${pluralize(results.length, "build")} kept (limit ${project.maxBuildAllowed})`;

  let content: ReactNode;
  if (!results || !project) {
    content = (
      <Box role="status" aria-label="Loading statistics">
        <SkeletonList />
      </Box>
    );
  } else if (results.length === 0) {
    content = (
      <EmptyState
        icon={<BarChartOutlined />}
        title="No builds yet"
        description={
          branchName
            ? `Branch ${branchName} has no builds.`
            : "Results per build will show up here once the project has builds."
        }
      />
    );
  } else {
    content = (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <ResultsChart builds={results} projectId={projectId} />
        {results.length < FEW_BUILDS && (
          <EmptyState
            dense
            icon={<BarChartOutlined />}
            title="Only a few builds so far"
            description="Trends become visible after a few more builds."
          />
        )}
      </Paper>
    );
  }

  return (
    <PageContainer>
      <PageToolbar summary={subtitle}>
        {branches.length > 0 && (
          <TextField
            select
            size="small"
            label="Branch"
            value={branchName}
            onChange={(event) => setBranchName(event.target.value)}
            sx={{ minWidth: 200 }}
            slotProps={{
              select: { displayEmpty: true },
              inputLabel: { shrink: true },
            }}
          >
            <MenuItem value="">All branches</MenuItem>
            {branches.map((branch) => (
              <MenuItem key={branch} value={branch}>
                {branch}
              </MenuItem>
            ))}
          </TextField>
        )}
      </PageToolbar>
      {content}
    </PageContainer>
  );
};

const ProjectStatisticsPage = () => {
  const { projectId = "" } = useParams<{ projectId: string }>();
  return <ProjectStatistics key={projectId} projectId={projectId} />;
};

export default ProjectStatisticsPage;
