import { IgnoreArea } from "../types/ignoreArea";
import { v4 as uniqueId } from "uuid";

export const invertIgnoreArea = (
  imageWidth: number,
  imageHeight: number,
  ignoreArea?: IgnoreArea,
): IgnoreArea[] => {
  if (!ignoreArea) {
    return [];
  }

  const ignoreArea1 = {
    x: 0,
    y: 0,
    width: ignoreArea.x,
    height: ignoreArea.y,
    id: uniqueId(),
  };

  const ignoreArea2 = {
    x: ignoreArea.x,
    y: 0,
    width: ignoreArea.width,
    height: ignoreArea.y,
    id: uniqueId(),
  };

  const ignoreArea3 = {
    x: ignoreArea.x + ignoreArea.width,
    y: 0,
    width: imageWidth - (ignoreArea1.width + ignoreArea2.width),
    height: ignoreArea.y,
    id: uniqueId(),
  };

  const ignoreArea4 = {
    x: ignoreArea1.x,
    y: ignoreArea1.y + ignoreArea1.height,
    width: ignoreArea1.width,
    height: ignoreArea.height,
    id: uniqueId(),
  };

  const ignoreArea5 = {
    x: ignoreArea3.x,
    y: ignoreArea3.y + ignoreArea3.height,
    width: ignoreArea3.width,
    height: ignoreArea.height,
    id: uniqueId(),
  };

  const ignoreArea6 = {
    x: ignoreArea4.x,
    y: ignoreArea4.y + ignoreArea4.height,
    width: ignoreArea1.width,
    height: imageHeight - (ignoreArea1.height + ignoreArea.height),
    id: uniqueId(),
  };

  const ignoreArea7 = {
    x: ignoreArea.x,
    y: ignoreArea.y + ignoreArea.height,
    width: ignoreArea.width,
    height: ignoreArea6.height,
    id: uniqueId(),
  };

  const ignoreArea8 = {
    x: ignoreArea5.x,
    y: ignoreArea5.y + ignoreArea5.height,
    width: ignoreArea5.width,
    height: ignoreArea6.height,
    id: uniqueId(),
  };

  return [
    ignoreArea1,
    ignoreArea2,
    ignoreArea3,
    ignoreArea4,
    ignoreArea5,
    ignoreArea6,
    ignoreArea7,
    ignoreArea8,
  ];
};
