export const MIN_SCALE = 0.1;
export const MAX_SCALE = 10;

/// Keeps a zoom level within the range the image can still be worked with
export function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/// Calculates element scale to fit into specified dimensions
export function calculateScale(
  width: number,
  height: number,
  containerWidth: number,
  containerHeight: number,
) {
  return Math.min(
    containerWidth < width ? containerWidth / width : 1,
    containerHeight < height ? containerHeight / height : 1,
  );
}
