import { useCallback, useMemo } from "react";
import { parseNoiseAnalysisConfig } from "../../_helpers/noiseHint.helper";
import {
  setProjectEditState,
  useProjectDispatch,
  useProjectState,
} from "../../contexts";
import { NoiseAnalysisConfig } from "../../types";

type Stage = keyof NoiseAnalysisConfig;

export const useNoiseConfig = () => {
  const { projectEditState: project } = useProjectState();
  const projectDispatch = useProjectDispatch();

  const config = useMemo(
    () => parseNoiseAnalysisConfig(project.noiseAnalysisConfig),
    [project.noiseAnalysisConfig],
  );

  const updateConfig = useCallback(
    <S extends Stage, K extends keyof NoiseAnalysisConfig[S]>(
      stage: S,
      key: K,
      value: NoiseAnalysisConfig[S][K],
    ) => {
      const parsed = parseNoiseAnalysisConfig(project.noiseAnalysisConfig);

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
