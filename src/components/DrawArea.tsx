import React, { FunctionComponent } from "react";
import { Stage, Layer, Image } from "react-konva";
import { RectConfig } from "konva/types/shapes/Rect";
import Rectangle from "./Rectangle";
import { KonvaEventObject } from "konva/types/Node";
import useImage from "use-image";
import { staticService } from "../services";
import { IgnoreArea } from "../types/ignoreArea";

const DrawArea: FunctionComponent<{
  width: number;
  height: number;
  imageUrl: string;
  ignoreAreas: IgnoreArea[];
  setIgnoreAreas: (ignoreAreas: IgnoreArea[]) => void;
}> = ({ width, height, imageUrl, ignoreAreas, setIgnoreAreas }) => {
  const [image] = useImage(staticService.getImage(imageUrl));
  const scale = image
    ? Math.min(width / image.width, height / image.height)
    : 1;

  const [selectedId, selectShape] = React.useState<string>();

  const removeSelection = (event: KonvaEventObject<MouseEvent>) => {
    // deselect when clicked not on Rect
    const isRectClicked = event.target.className === "Rect";
    if (!isRectClicked) {
      selectShape(undefined);
    }
  };
  console.log(ignoreAreas);
  return (
    <Stage width={width} height={height} onMouseDown={removeSelection}>
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
              isSelected={rect.id === selectedId}
              onSelect={() => {
                selectShape(rect.id);
              }}
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
