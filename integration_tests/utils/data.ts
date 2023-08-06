import { ImageComparison, Project } from "~client/types";

export const API_URL = "http://localhost:4200";
export const getProjectsGetUrl = (host: string) => `${host}/projects`;
export const getProjectsDeleteUrl = (host: string, id: string) =>
  `${host}/projects/${id}`;
export const getBuildsGetUrl = (projectId: string) =>
  `${API_URL}/builds?projectId=${projectId}&take=10&skip=0`;

export const PROJECT: Project = {
  id: "f83d71f1",
  name: "Test project",
  mainBranchName: "develop",
  builds: [],
  maxBuildAllowed: 100,
  maxBranchLifetime: 30,
  updatedAt: "2023-05-17T13:58:41.910Z",
  createdAt: "2021-09-10T11:57:44.791Z",
  autoApproveFeature: true,
  imageComparison: ImageComparison.pixelmatch,
  imageComparisonConfig:
    '{"threshold":0.1,"ignoreAntialiasing":true,"allowDiffDimensions":false}',
};
