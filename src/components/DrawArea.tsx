import React, { FunctionComponent } from "react";
import { Stage, Layer, Image } from "react-konva";

const DrawArea: FunctionComponent<{
  width: number;
  height: number;
  image: HTMLImageElement;
}> = ({ width, height, image }) => {
  const scale = Math.min(width / image.width, height / image.height);

  return (
    <Stage width={width} height={height}>
      <Layer>
        <Image
          draggable
          image={image}
          scaleX={scale}
          scaleY={scale}
        />
      </Layer>
    </Stage>
  );
};

export default DrawArea;
