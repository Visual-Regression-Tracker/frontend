import { type RefObject, useState } from "react";
import Konva from "konva";
import { MIN_RECT_SIDE_PIXEL } from "../Rectangle";
import { clampToImage } from "../../_helpers/ignoreArea.helper";
import { IgnoreArea } from "../../types/ignoreArea";

export function useIgnoreAreaDrawing({
  stageRef,
  isDrawMode,
  setIsDrawMode,
  ignoreAreas,
  setIgnoreAreas,
  selectedRectId,
  setSelectedRectId,
  stageWidth,
  stageHeight,
}: {
  stageRef: RefObject<Konva.Stage | null>;
  isDrawMode: boolean;
  setIsDrawMode: (value: boolean) => void;
  ignoreAreas: IgnoreArea[];
  setIgnoreAreas: (ignoreAreas: IgnoreArea[]) => void;
  selectedRectId: string | undefined;
  setSelectedRectId: (id: string) => void;
  stageWidth: number;
  stageHeight: number;
}) {
  const [isDrawing, setIsDrawing] = useState(isDrawMode);

  const handleContentMousedown = (
    event: Konva.KonvaEventObject<MouseEvent>,
  ) => {
    if (stageRef.current) {
      const container = stageRef.current.container();
      container.tabIndex = 1;
    }

    if (!isDrawMode) {
      return;
    }

    // starts inside the border: the smallest area at the edge would cross it
    const newArea: IgnoreArea = {
      id: Date.now().toString(),
      x: Math.min(event.evt.offsetX, stageWidth - MIN_RECT_SIDE_PIXEL),
      y: Math.min(event.evt.offsetY, stageHeight - MIN_RECT_SIDE_PIXEL),
      width: MIN_RECT_SIDE_PIXEL,
      height: MIN_RECT_SIDE_PIXEL,
    };

    setIgnoreAreas([...ignoreAreas, newArea]);
    setSelectedRectId(newArea.id);
    setIsDrawing(true);
  };

  const handleContentMouseup = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setIsDrawMode(false);
    }
  };

  const handleContentMouseMove = (
    event: Konva.KonvaEventObject<MouseEvent>,
  ) => {
    if (!isDrawMode) return;

    if (isDrawing) {
      const newShapesList = ignoreAreas.map((i) => {
        if (i.id === selectedRectId) {
          return clampToImage(
            {
              ...i,
              width: Math.max(
                Math.round(event.evt.offsetX - i.x),
                MIN_RECT_SIDE_PIXEL,
              ),
              height: Math.max(
                Math.round(event.evt.offsetY - i.y),
                MIN_RECT_SIDE_PIXEL,
              ),
            },
            stageWidth,
            stageHeight,
          );
        }

        return i;
      });

      setIgnoreAreas(newShapesList);
    }
  };

  return {
    handleContentMousedown,
    handleContentMouseup,
    handleContentMouseMove,
  };
}
