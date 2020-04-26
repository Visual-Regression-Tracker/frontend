import { IgnoreArea } from "./ignoreArea";

export interface TestVariation {
  id: string;
  name: string;
  baselineName: string;
  os: string;
  browser: string;
  viewport: string;
  device: string;
  ignoreAreas: IgnoreArea[];
}
