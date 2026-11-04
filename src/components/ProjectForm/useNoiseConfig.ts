import { useCallback, useMemo } from "react";
import { DEFAULT_NOISE_ANALYSIS_CONFIG } from "../../constants";
import {
  setProjectEditState,
  useProjectDispatch,
  useProjectState,
} from "../../contexts";
import { NoiseAnalysisConfig } from "../../types";

type Stage = keyof NoiseAnalysisConfig;

const parse = (json: string | undefined): NoiseAnalysisConfig => {
  let saved: Partial<Record<Stage, object>> = {};
  try {
    saved = (JSON.parse(json || "{}") as typeof saved | null) ?? {};
  } catch {
    saved = {};
  }
  return {
    ...saved,
    blur: { ...DEFAULT_NOISE_ANALYSIS_CONFIG.blur, ...saved.blur },
    dinov2: { ...DEFAULT_NOISE_ANALYSIS_CONFIG.dinov2, ...saved.dinov2 },
  };
};

export const useNoiseConfig = () => {
  const { projectEditState: project } = useProjectState();
  const projectDispatch = useProjectDispatch();

  const config = useMemo(
    () => parse(project.noiseAnalysisConfig),
    [project.noiseAnalysisConfig],
  );

  const updateConfig = useCallback(
    <S extends Stage, K extends keyof NoiseAnalysisConfig[S]>(
      stage: S,
      key: K,
      value: NoiseAnalysisConfig[S][K],
    ) => {
      const parsed = parse(project.noiseAnalysisConfig);

      const noiseAnalysisConfig = JSON.stringify({
        ...parsed,
        [stage]: { ...parsed[stage], [key]: value },
      });

      setProjectEditState(projectDispatch, { ...project, noiseAnalysisConfig });
    },
    [projectDispatch, project],
  );

  return [config, updateConfig] as const;
};
