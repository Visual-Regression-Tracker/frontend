import type { NoiseVerdict } from "../types";

export const VERDICT_TEXT: Record<NoiseVerdict, string> = {
  noise: "likely noise",
  change: "likely change",
  unknown: "no verdict",
};

export const ANALYSING = "Analysing";

export const LIMITATION =
  "A hint, not a decision. It can call a small real change noise — a single digit, a dot, a faint border. Look at the diff before approving.";
