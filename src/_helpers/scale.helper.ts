/// Calculates element scale to fit into specified dimensions
export function calculateScale(
  width: number,
  height: number,
  containerWidth: number,
  containerHeight: number
) {
  return Math.min(
    containerWidth < width ? containerWidth / width : 1,
    containerHeight < height ? containerHeight / height : 1
  );
}
