import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { useSnackbar } from "notistack";
import {
  createProject,
  setProjectEditState,
  useProjectDispatch,
  useProjectState,
} from "../contexts";
import { routes } from "../constants";
import { buildProjectPageUrl } from "../_helpers/route.helpers";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { ProjectFormLayout } from "../components/ProjectForm/ProjectFormLayout";
import { ValidatedForm } from "../components/ValidatedForm";

const AddProjectPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { projectEditState } = useProjectState();
  const projectDispatch = useProjectDispatch();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProjectEditState(projectDispatch);
    return () => setProjectEditState(projectDispatch);
  }, [projectDispatch]);

  const create = () => {
    setSaving(true);
    createProject(projectDispatch, projectEditState)
      .then((project) => {
        enqueueSnackbar(`${project.name} created`, { variant: "success" });
        void navigate(buildProjectPageUrl(project.id));
      })
      .catch((err: string) => {
        enqueueSnackbar(err, { variant: "error" });
        setSaving(false);
      });
  };

  return (
    <PageContainer>
      <PageHeader title="Add project" />
      <ValidatedForm onSubmit={create}>
        <ProjectFormLayout
          actions={
            <>
              <Button
                disabled={saving}
                onClick={() => void navigate(routes.PROJECT_LIST_PAGE)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={saving}>
                Create
              </Button>
            </>
          }
        />
      </ValidatedForm>
    </PageContainer>
  );
};

export default AddProjectPage;
