import React, { FunctionComponent } from "react";
import { Stage, Layer, Image } from "react-konva";
import { RectConfig } from "konva/types/shapes/Rect";
import Rectangle from "./Rectangle";
import { KonvaEventObject } from "konva/types/Node";
import useImage from "use-image";
import { staticService } from "../services";

const DrawArea: FunctionComponent<{
  width: number;
  height: number;
  imageUrl: string;
  ignoreAreas: RectConfig[];
}> = ({ width, height, imageUrl, ignoreAreas }) => {
  const [image] = useImage(staticService.getImage(imageUrl));
  const scale = image && Math.min(width / image.width, height / image.height);

  const [rectangles, setRectangles] = React.useState(ignoreAreas);
  const [selectedId, selectShape] = React.useState<string>();

  const removeSelection = (event: KonvaEventObject<MouseEvent>) => {
    // deselect when clicked not on Rect
    const isRectClicked = event.target.className === "Rect";
    if (!isRectClicked) {
      selectShape(undefined);
    }
  };

  return (
    <Stage width={width} height={height} onMouseDown={removeSelection}>
      <Layer>
        <Image image={image} scaleX={scale} scaleY={scale} />
        {rectangles.map((rect, i) => {
          return (
            <Rectangle
              key={i}
              shapeProps={rect}
              isSelected={rect.id === selectedId}
              onSelect={() => {
                selectShape(rect.id);
              }}
              onChange={(newAttrs: any) => {
                const rects = rectangles.slice();
                rects[i] = newAttrs;
                setRectangles(rects);
              }}
            />
          );
        })}
      </Layer>
    </Stage>
  );
};

export default DrawArea;
