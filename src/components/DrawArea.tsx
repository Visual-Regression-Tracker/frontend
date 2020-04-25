import React, { FunctionComponent } from "react";
import { Stage, Layer, Image } from "react-konva";
import { RectConfig } from "konva/types/shapes/Rect";
import Rectangle from "./Rectangle";
import { KonvaEventObject } from "konva/types/Node";
import useImage from "use-image";
import { staticService } from "../services";
import { IgnoreArea } from "../types/ignoreArea";

interface IDrawArea {
  width: number;
  height: number;
  imageUrl: string;
  ignoreAreas: IgnoreArea[];
  setIgnoreAreas: (ignoreAreas: IgnoreArea[]) => void;
  selectedRectId: string | undefined;
  setSelectedRectId: (id: string) => void;
  onStageClick: (event: KonvaEventObject<MouseEvent>) => void;
}
const DrawArea: FunctionComponent<IDrawArea> = ({
  width,
  height,
  imageUrl,
  ignoreAreas,
  setIgnoreAreas,
  selectedRectId,
  setSelectedRectId,
  onStageClick,
}) => {
  const [image] = useImage(staticService.getImage(imageUrl));

  // fit image to available area size
  const scale = image
    ? Math.min(width / image.width, height / image.height)
    : 1;

  // fit canvas to new image size
  const stageWidth = image && image.width * scale;
  const stageHeight = image && image.height * scale;

  return (
    <Stage width={stageWidth} height={stageHeight} onMouseDown={onStageClick}>
      <Layer>
        <Image image={image} scaleX={scale} scaleY={scale} />
        {ignoreAreas.map((rect, i) => {
          return (
            <Rectangle
              key={rect.id}
              shapeProps={{
                // transform pixels according to scale
                x: rect.x * scale,
                y: rect.y * scale,
                width: rect.width * scale,
                height: rect.height * scale,
              }}
              isSelected={rect.id === selectedRectId}
              onSelect={() => setSelectedRectId(rect.id)}
              onChange={(newAttrs: RectConfig) => {
                const rects = ignoreAreas.slice();
                // transform scale to pixels
                rects[i].x = Math.round((newAttrs.x || 0) / scale);
                rects[i].y = Math.round((newAttrs.y || 0) / scale);
                rects[i].width = Math.round((newAttrs.width || 0) / scale);
                rects[i].height = Math.round((newAttrs.height || 0) / scale);

                setIgnoreAreas(rects);
              }}
            />
          );
        })}
      </Layer>
    </Stage>
  );
};

export default DrawArea;
