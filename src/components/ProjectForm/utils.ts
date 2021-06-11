import { PixelmatchConfig } from "../../types/imageComparison";

export const parseImageComparisonConfig = <T extends PixelmatchConfig>(
  config: string
): T => JSON.parse(config);

export const modifyConfigProp = <T extends PixelmatchConfig>(
  config: string,
  name: keyof T,
  value: T[typeof name]
): string => {
  const parsed: T = JSON.parse(config);

  return JSON.stringify({
    ...parsed,
    [name]: value,
  });
};
