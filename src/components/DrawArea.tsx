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
  stageOffsetState: [
    { x: number; y: number },
    React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  ];
  stageInitPosState: [
    { x: number; y: number },
    React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  ];
  stagePosState: [
    { x: number; y: number },
    React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  ];
  stageScaleState: [number, React.Dispatch<React.SetStateAction<number>>];
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
  stageScaleState,
  stageOffsetState,
  stageInitPosState,
  stagePosState,
}) => {
  const [stageInitPos, setStageInitPos] = stageInitPosState;
  const [stageOffset, setStageOffset] = stageOffsetState;
  const [stagePos, setStagePos] = stagePosState;
  const [stageScale, setStageScale] = stageScaleState;
  const [image] = useImage(staticService.getImage(imageUrl));
  const [isDrag, setIsDrag] = React.useState(false);

  // fit image to available area size
  // const scale = image
  //   ? Math.min(width / image.width, height / image.height)
  //   : 1;

  const scale = 1;

  // fit canvas to new image size
  const stageWidth = image && image.width * scale;
  const stageHeight = image && image.height * scale;
  return (
    <div
      style={{
        overflow: "hidden",
      }}
    >
      <div
        style={{
          transform: `translate3d(${stagePos.x}px, ${stagePos.y}px, 0px)`,
        }}
        onMouseMove={(event) => {
          if (isDrag) {
            event.preventDefault();
            setStagePos({
              x: event.clientX - stageInitPos.x,
              y: event.clientY - stageInitPos.y,
            });
            setStageOffset(stagePos);
          }
        }}
        onMouseUp={(event) => {
          setIsDrag(false);
          setStageInitPos(stagePos);
        }}
        onMouseLeave={(event) => {
          setIsDrag(false);
          setStageInitPos(stagePos);
        }}
        onMouseDown={(event) => {
          setIsDrag(true);
          setStageInitPos({
            x: event.clientX - stageOffset.x,
            y: event.clientY - stageOffset.y,
          });
        }}
      >
        <Stage
          // x={stagePos.x}
          // y={stagePos.y}
          width={stageWidth}
          height={stageHeight}
          onMouseDown={onStageClick}
          // scaleX={stageScale}
          // scaleY={stageScale}
          // draggable={true}
          // onDragEnd={(event: KonvaEventObject<DragEvent>) => {
          //   console.log(event.target.getType());
          //   if (event.target.getType() === "Stage") {
          //     setStatePos({ x: event.target.x(), y: event.target.y() });
          //   }
          // }}
          style={{
            transform: `scale(${stageScale})`,
          }}
        >
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
                    rects[i].height = Math.round(
                      (newAttrs.height || 0) / scale
                    );

                    setIgnoreAreas(rects);
                  }}
                />
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default DrawArea;
