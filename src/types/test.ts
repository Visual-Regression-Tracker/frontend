import { RectConfig } from "konva/types/shapes/Rect";
import { TestStatus } from "./testStatus";

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
  ignoreAreas: RectConfig[];
}
