import { readFileSync } from "node:fs";
import { PNG } from "pngjs";
import type { RawImage } from "../_helpers/solidMask.helper";

export const readPng = (file: string): RawImage => {
  const { data, width, height } = PNG.sync.read(readFileSync(file));
  return { data, width, height };
};
