import { IgnoreArea } from "../types/ignoreArea";

type Box = Pick<IgnoreArea, "x" | "y" | "width" | "height">;

// crypto.randomUUID exists only in secure contexts, and VRT is often served over plain HTTP
const newId = (): string => {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const clampToImage = <T extends Box>(
  area: T,
  imageWidth: number,
  imageHeight: number,
): T => {
  const left = clamp(area.x, 0, imageWidth);
  const top = clamp(area.y, 0, imageHeight);
  const right = clamp(area.x + area.width, 0, imageWidth);
  const bottom = clamp(area.y + area.height, 0, imageHeight);

  return {
    ...area,
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
};

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
    id: newId(),
  };

  const ignoreArea2 = {
    x: ignoreArea.x,
    y: 0,
    width: ignoreArea.width,
    height: ignoreArea.y,
    id: newId(),
  };

  const ignoreArea3 = {
    x: ignoreArea.x + ignoreArea.width,
    y: 0,
    width: imageWidth - (ignoreArea1.width + ignoreArea2.width),
    height: ignoreArea.y,
    id: newId(),
  };

  const ignoreArea4 = {
    x: ignoreArea1.x,
    y: ignoreArea1.y + ignoreArea1.height,
    width: ignoreArea1.width,
    height: ignoreArea.height,
    id: newId(),
  };

  const ignoreArea5 = {
    x: ignoreArea3.x,
    y: ignoreArea3.y + ignoreArea3.height,
    width: ignoreArea3.width,
    height: ignoreArea.height,
    id: newId(),
  };

  const ignoreArea6 = {
    x: ignoreArea4.x,
    y: ignoreArea4.y + ignoreArea4.height,
    width: ignoreArea1.width,
    height: imageHeight - (ignoreArea1.height + ignoreArea.height),
    id: newId(),
  };

  const ignoreArea7 = {
    x: ignoreArea.x,
    y: ignoreArea.y + ignoreArea.height,
    width: ignoreArea.width,
    height: ignoreArea6.height,
    id: newId(),
  };

  const ignoreArea8 = {
    x: ignoreArea5.x,
    y: ignoreArea5.y + ignoreArea5.height,
    width: ignoreArea5.width,
    height: ignoreArea6.height,
    id: newId(),
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
