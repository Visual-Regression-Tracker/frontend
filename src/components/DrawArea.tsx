import React, { FunctionComponent } from "react";
import { Stage, Layer, Image } from "react-konva";
import { RectConfig } from "konva/types/shapes/Rect";
import Rectangle from "./Rectangle";
import { KonvaEventObject } from "konva/types/Node";

const DrawArea: FunctionComponent<{
  width: number;
  height: number;
  image: HTMLImageElement;
  list: RectConfig[];
}> = ({ width, height, image, list }) => {
  const scale = Math.min(width / image.width, height / image.height);

  const [rectangles, setRectangles] = React.useState(list);
  const [selectedId, selectShape] = React.useState<string>();

  const removeSelection = (event: KonvaEventObject<MouseEvent>) => {
    // deselect when clicked not on Rect
    const isRectClicked = event.target.className === "Rect";
    if (!isRectClicked) {
      selectShape(undefined);
    }
  };

  return (
    <Stage
      width={width}
      height={height}
      onMouseDown={removeSelection}
    >
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
