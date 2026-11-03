import { useCallback, useMemo } from "react";
import {
  setProjectEditState,
  useProjectDispatch,
  useProjectState,
} from "../../contexts";
import { ImageComparisonConfig } from "../../types/imageComparison";

export const useConfigHook = <T extends ImageComparisonConfig>() => {
  const { projectEditState: project } = useProjectState();
  const projectDispatch = useProjectDispatch();

  const config = useMemo(
    () => JSON.parse(project.imageComparisonConfig) as T,
    [project.imageComparisonConfig],
  );

  const updateConfig = useCallback(
    (name: keyof T, value: T[typeof name]) => {
      const parsed = JSON.parse(project.imageComparisonConfig) as T;

      const imageComparisonConfig = JSON.stringify({
        ...parsed,
        [name]: value,
      });

      setProjectEditState(projectDispatch, {
        ...project,
        imageComparisonConfig,
      });
    },
    [projectDispatch, project],
  );

  return [config, updateConfig] as const;
};
