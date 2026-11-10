import { useMemo } from "react";
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

  const setEnabled = (stage: Stage, enabled: boolean) => {
    const noiseAnalysisConfig = JSON.stringify({
      ...config,
      [stage]: { enabled },
    });

    setProjectEditState(projectDispatch, { ...project, noiseAnalysisConfig });
  };

  return [config, setEnabled] as const;
};
