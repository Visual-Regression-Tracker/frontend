import React, { useEffect } from "react";
import {
  Grid,
  Typography,
  Card,
  IconButton,
  CardContent,
  CardActions,
  Fab,
  Button,
  Container,
  Box,
  useTheme,
} from "@material-ui/core";
import {
  useProjectState,
  useProjectDispatch,
  getProjectList,
  deleteProject,
  createProject,
  updateProject,
} from "../contexts";
import { Link } from "react-router-dom";
import { Delete, Add, Edit } from "@material-ui/icons";
import { routes } from "../constants";
import { formatDateTime } from "../_helpers/format.helper";
import { ProjectModal } from "../components/ProjectModal";

const ProjectsListPage = () => {
  const theme = useTheme();
  const projectState = useProjectState();
  const projectDispatch = useProjectDispatch();

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false);
  const [project, setProject] = React.useState<{
    id: string;
    name: string;
    mainBranchName: string;
  }>({
    id: "",
    name: "",
    mainBranchName: "",
  });

  useEffect(() => {
    getProjectList(projectDispatch);
  }, [projectDispatch]);

  const toggleCreateDialogOpen = () => {
    setCreateDialogOpen(!createDialogOpen);
  };

  const toggleUpdateDialogOpen = () => {
    setUpdateDialogOpen(!updateDialogOpen);
  };

  return (
    <Container
      style={{
        marginTop: theme.spacing(4),
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Box
            height="100%"
            alignItems="center"
            justifyContent="center"
            display="flex"
          >
            <Fab
              color="primary"
              aria-label="add"
              onClick={() => {
                toggleCreateDialogOpen();
                setProject({
                  id: "",
                  name: "",
                  mainBranchName: "",
                });
              }}
            >
              <Add />
            </Fab>
          </Box>

          <ProjectModal
            open={createDialogOpen}
            title={"Create Project"}
            submitButtonText={"Create"}
            onCancel={toggleCreateDialogOpen}
            projectState={[project, setProject]}
            onSubmit={() =>
              createProject(projectDispatch, project).then((project) => {
                toggleCreateDialogOpen();
              })
            }
          />

          <ProjectModal
            open={updateDialogOpen}
            title={"Update Project"}
            submitButtonText={"Update"}
            onCancel={toggleUpdateDialogOpen}
            projectState={[project, setProject]}
            onSubmit={() =>
              updateProject(projectDispatch, project).then((project) => {
                toggleUpdateDialogOpen();
              })
            }
          />
        </Grid>
        {projectState.projectList.map((project) => (
          <Grid item xs={4} key={project.id}>
            <Card>
              <CardContent>
                <Typography>Key: {project.id}</Typography>
                <Typography>Name: {project.name}</Typography>
                <Typography>Main branch: {project.mainBranchName}</Typography>
                <Typography>
                  Created: {formatDateTime(project.createdAt)}
                </Typography>
              </CardContent>
              <CardActions>
                <Button color="primary" component={Link} to={`${project.id}`}>
                  Builds
                </Button>
                <Button
                  color="primary"
                  component={Link}
                  to={`${routes.VARIATION_LIST_PAGE}/${project.id}`}
                >
                  Variations
                </Button>
                <IconButton
                  onClick={(event: React.MouseEvent<HTMLElement>) => {
                    toggleUpdateDialogOpen();
                    setProject(project);
                  }}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  onClick={(event: React.MouseEvent<HTMLElement>) => {
                    deleteProject(projectDispatch, project.id);
                  }}
                >
                  <Delete />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ProjectsListPage;
