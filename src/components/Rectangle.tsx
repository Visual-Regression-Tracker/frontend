import Konva from "konva";
import React from "react";
import { type KonvaNodeEvents, Rect, Transformer } from "react-konva";

export const MIN_RECT_SIDE_PIXEL = 5;

interface IProps {
  shapeProps: Konva.NodeConfig;
  isSelected?: boolean;
  onSelect?: () => void;
  onChange?: (rectConfig: Konva.RectConfig) => void;
}

const Rectangle: React.FunctionComponent<IProps> = ({
  shapeProps,
  isSelected,
  onSelect,
  onChange,
}) => {
  const shapeRef = React.useRef<Konva.Rect>(null);
  const trRef = React.useRef<Konva.Transformer>(null);
  const rectProps: KonvaNodeEvents & Konva.ShapeConfig = {
    fill: "gray",
    opacity: 0.4,
    onClick: onSelect,
    onTap: onSelect,
    draggable: !!onSelect && !!onChange,
    ...shapeProps,
  };

  React.useEffect(() => {
    if (isSelected) {
      // we need to attach transformer manually
      trRef.current!.setNode(shapeRef.current);
      trRef.current!.getLayer()!.batchDraw();
    }
  }, [isSelected]);

  if (rectProps.draggable && onChange) {
    rectProps.dragBoundFunc = (pos) => {
      const component = shapeRef.current;
      if (!component) {
        return pos;
      }
      const rectWidth = component.width() * component.scaleX();
      const rectHeight = component.height() * component.scaleY();
      const layerSize = component.getLayer()!.getSize();

      return {
        x: pos.x > 0 ? Math.min(layerSize.width - rectWidth, pos.x) : 0,
        y: pos.y > 0 ? Math.min(layerSize.height - rectHeight, pos.y) : 0,
      };
    };

    rectProps.onDragEnd = (e) =>
      onChange({
        ...shapeProps,
        x: e.target.x(),
        y: e.target.y(),
      });

    rectProps.onTransformEnd = (e) => {
      // transformer is changing scale of the node
      // and NOT its width or height
      // but in the store we have only width and height
      // to match the data better we will reset scale on transform end
      const node = shapeRef.current;
      if (!node) {
        return;
      }
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // we will reset it back
      node.scaleX(1);
      node.scaleY(1);
      onChange({
        ...shapeProps,
        x: node.x(),
        y: node.y(),
        // set minimal value
        width: Math.max(MIN_RECT_SIDE_PIXEL, node.width() * scaleX),
        height: Math.max(MIN_RECT_SIDE_PIXEL, node.height() * scaleY),
      });
    };

    rectProps.onMouseOver = (event: Konva.KonvaEventObject<MouseEvent>) => {
      document.body.style.cursor = "pointer";
    };
    rectProps.onMouseDown = (event: Konva.KonvaEventObject<MouseEvent>) => {
      document.body.style.cursor = "grabbing";
    };
    rectProps.onMouseUp = (event: Konva.KonvaEventObject<MouseEvent>) => {
      document.body.style.cursor = "grab";
    };
    rectProps.onMouseLeave = (event: Konva.KonvaEventObject<MouseEvent>) => {
      document.body.style.cursor = "default";
    };
  }
  return (
    <React.Fragment>
      <Rect ref={shapeRef} {...rectProps} />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (
              newBox.width < MIN_RECT_SIDE_PIXEL ||
              newBox.height < MIN_RECT_SIDE_PIXEL
            ) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

export default Rectangle;
