import React from "react";
import {
  setProjectEditState,
  useProjectDispatch,
  useProjectState,
} from "../../contexts";
import { ImageComparisonConfig } from "../../types/imageComparison";
import { modifyConfigProp, parseImageComparisonConfig } from "./utils";

export const useConfigHook = <T extends ImageComparisonConfig>() => {
  const { projectEditState: project } = useProjectState();
  const projectDispatch = useProjectDispatch();

  const config: T = React.useMemo(
    () => parseImageComparisonConfig<T>(project.imageComparisonConfig),
    [project.imageComparisonConfig]
  );

  const updateConfig = React.useCallback(
    (name: keyof T, value: T[typeof name]) => {
      const imageComparisonConfig = modifyConfigProp<T>(
        project.imageComparisonConfig,
        name,
        value
      );
      setProjectEditState(projectDispatch, {
        ...project,
        imageComparisonConfig,
      });
    },
    [projectDispatch, project]
  );

  return [config, updateConfig] as const;
};
