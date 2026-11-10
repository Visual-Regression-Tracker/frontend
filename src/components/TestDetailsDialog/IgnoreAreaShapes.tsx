import Konva from "konva";
import Rectangle, { MIN_RECT_SIDE_PIXEL } from "../Rectangle";
import { clampToImage } from "../../_helpers/ignoreArea.helper";
import { IgnoreArea } from "../../types/ignoreArea";

export const IgnoreAreaShapes = ({
  ignoreAreas,
  tempIgnoreAreas,
  readOnly,
  selectedRectId,
  setSelectedRectId,
  setIgnoreAreas,
  stageWidth,
  stageHeight,
}: {
  ignoreAreas: IgnoreArea[];
  tempIgnoreAreas: IgnoreArea[];
  readOnly: boolean;
  selectedRectId: string | undefined;
  setSelectedRectId: (id: string) => void;
  setIgnoreAreas: (ignoreAreas: IgnoreArea[]) => void;
  stageWidth: number;
  stageHeight: number;
}) => {
  return (
    <>
      {ignoreAreas.map((rect, i) =>
        readOnly ? (
          <Rectangle
            key={rect.id}
            shapeProps={{
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              listening: false,
            }}
          />
        ) : (
          <Rectangle
            key={rect.id}
            shapeProps={{
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            }}
            isSelected={rect.id === selectedRectId}
            onSelect={() => setSelectedRectId(rect.id)}
            onChange={(newAttrs: Konva.RectConfig) => {
              const rects = ignoreAreas.slice();

              rects[i] = clampToImage(
                {
                  ...rects[i],
                  x: Math.round(newAttrs.x || 0),
                  y: Math.round(newAttrs.y || 0),
                  width: Math.round(newAttrs.width || MIN_RECT_SIDE_PIXEL),
                  height: Math.round(newAttrs.height || MIN_RECT_SIDE_PIXEL),
                },
                stageWidth,
                stageHeight,
              );

              setIgnoreAreas(rects);
            }}
          />
        ),
      )}
      {tempIgnoreAreas.map((rect, i) => (
        <Rectangle
          key={i}
          shapeProps={{
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            // shown only: over the areas being edited, so they must not take the pointer
            listening: false,
          }}
        />
      ))}
    </>
  );
};
