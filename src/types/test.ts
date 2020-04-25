import { TestStatus } from "./testStatus";
import { IgnoreArea } from "./ignoreArea";

export interface Test {
  id: string;
  name: string;
  buildId: number;
  baselineUrl: string;
  imageUrl: string;
  diffUrl: string;
  os: string;
  browser: string;
  viewport: string;
  device: string;
  status: TestStatus;
  ignoreAreas: IgnoreArea[];
}
