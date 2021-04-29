import { Build } from "./build";
import { ImageComparison } from "./imageComparison";

export interface Project {
  id: string;
  name: string;
  mainBranchName: string;
  builds: Build[];
  updatedAt: string;
  createdAt: string;
  autoApproveFeature: boolean;
  diffDimensionsFeature: boolean;
  ignoreAntialiasing: boolean;
  threshold: number;
  imageComparison: ImageComparison;
}

export type ProjectDto = Omit<Project, "updatedAt" | "createdAt" | "builds">;
