import type { NoiseAnalysis, NoiseAnalysisDto, NoiseVerdict } from "../types";

export const VERDICT_TEXT: Record<NoiseVerdict, string> = {
  noise: "likely noise",
  change: "likely change",
  unknown: "no verdict",
};

export const LIMITATION =
  "A hint, not a decision. It can call a small real change noise — a single digit, a dot, a faint border. Look at the highlighted areas before approving.";

const stageText = (verdict: NoiseVerdict, score: number) =>
  `${VERDICT_TEXT[verdict]} (${score.toFixed(2)})`;

export function stagesText({
  blur,
  dinov2,
}: Pick<NoiseAnalysisDto | NoiseAnalysis, "blur" | "dinov2">): string {
  const blurText = blur ? stageText(blur.verdict, blur.score) : "no verdict";
  if (!dinov2) {
    return `Blur only: ${blurText}`;
  }
  let dinov2Text: string;
  if ("error" in dinov2) {
    dinov2Text = "did not answer";
  } else if ("skipped" in dinov2) {
    dinov2Text =
      dinov2.skipped === "off"
        ? "off in this project"
        : "not needed, blur already sees a change";
  } else {
    dinov2Text = stageText(dinov2.verdict, dinov2.score);
  }
  return `Blur: ${blurText} · DINOv2: ${dinov2Text}`;
}
