import React from "react";
import {
  setProjectEditState,
  useProjectDispatch,
  useProjectState,
} from "../../contexts";
import { ImageComparisonConfig } from "../../types/imageComparison";

export const useConfigHook = <T extends ImageComparisonConfig>() => {
  const { projectEditState: project } = useProjectState();
  const projectDispatch = useProjectDispatch();

  const config: T = React.useMemo(
    () => JSON.parse(project.imageComparisonConfig),
    [project.imageComparisonConfig]
  );

  const updateConfig = React.useCallback(
    (name: keyof T, value: T[typeof name]) => {
      const parsed: T = JSON.parse(project.imageComparisonConfig);

      const imageComparisonConfig = JSON.stringify({
        ...parsed,
        [name]: value,
      });

      setProjectEditState(projectDispatch, {
        ...project,
        imageComparisonConfig,
      });
    },
    [projectDispatch, project]
  );

  return [config, updateConfig] as const;
};
