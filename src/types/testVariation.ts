import { Baseline } from "./baseline";

export interface TestVariation {
  id: string;
  name: string;
  baselineName: string;
  branchName: string;
  os: string;
  browser: string;
  viewport: string;
  device: string;
  customTags: string;
  ignoreAreas: string;
  projectId: string;
  baselines: Baseline[];
  comment?: string;
}
