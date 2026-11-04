import type { TestRun } from "../types";
import type { NoiseSummary } from "../types/noiseAnalysis";
import { TestStatus } from "../types/testStatus";
import { noiseHintOf } from "./noiseHint.helper";

const MIN_UNRESOLVED = 5;
const MIN_SHARE_WITH_HISTORY = 0.5;
const MIN_SHARE_WITHOUT_HISTORY = 0.8;
const TYPICAL_FACTOR = 2;

export function buildNoiseCaption(
  runs: Pick<TestRun, "status" | "noiseAnalysis">[],
): string | null {
  const unresolved = runs.filter((run) => run.status === TestStatus.unresolved);
  if (unresolved.length === 0) {
    return null;
  }
  const hints = unresolved.map(noiseHintOf);
  const noise = hints.filter((hint) => hint === "noise").length;
  const analysed = hints.filter(
    (hint) => hint === "noise" || hint === "change",
  ).length;
  return `${noise} of ${unresolved.length} unresolved look like rendering noise · analysed ${analysed} of ${unresolved.length}`;
}

export function looksLikeRendererChange(summary: NoiseSummary): boolean {
  const { unresolved, analysed, noiseLike, projectTypical } = summary;
  if (unresolved < MIN_UNRESOLVED || analysed !== unresolved) {
    return false;
  }
  const share = noiseLike / unresolved;
  return projectTypical === undefined
    ? share >= MIN_SHARE_WITHOUT_HISTORY
    : share >= TYPICAL_FACTOR * projectTypical &&
        share >= MIN_SHARE_WITH_HISTORY;
}

const titleCase = (name: string) =>
  name === name.toLowerCase()
    ? name.charAt(0).toUpperCase() + name.slice(1)
    : name;

function noisyEnvironment(summary: NoiseSummary): string | null {
  const noisy = summary.byEnvironment.filter((group) => group.noiseLike > 0);
  if (noisy.length !== 1) {
    return null;
  }
  const [{ browser, os, device }] = noisy;
  const name = browser || os || device;
  return name ? titleCase(name) : null;
}

export function rendererChangeText(summary: NoiseSummary): string | null {
  if (!looksLikeRendererChange(summary)) {
    return null;
  }
  const environment = noisyEnvironment(summary);
  const subject = environment ? `${environment} runs look` : "This build looks";
  const usual =
    summary.projectTypical === undefined
      ? ""
      : ` (usually ${Math.round(summary.projectTypical * 100)} % in this project)`;
  return `${subject} like a renderer change: ${summary.noiseLike} of ${summary.unresolved} diffs are rendering noise${usual}. Filter likely noise and review them in one pass`;
}
