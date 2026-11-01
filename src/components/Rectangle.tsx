import Konva from "konva";
import { Fragment, useEffect, useRef } from "react";
import { KonvaNodeEvents, Rect, Transformer } from "react-konva";
import { clampToImage } from "../_helpers/ignoreArea.helper";

export const MIN_RECT_SIDE_PIXEL = 5;

interface IProps {
  shapeProps: Konva.NodeConfig;
  isSelected?: boolean;
  onSelect?: () => void;
  onChange?: (rectConfig: Konva.RectConfig) => void;
}

const Rectangle = ({ shapeProps, isSelected, onSelect, onChange }: IProps) => {
  const shapeRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const rectProps: KonvaNodeEvents & Konva.ShapeConfig = {
    fill: "gray",
    opacity: 0.4,
    onClick: onSelect,
    onTap: onSelect,
    draggable: !!onSelect && !!onChange,
    ...shapeProps,
  };

  useEffect(() => {
    if (isSelected && shapeRef.current) {
      trRef.current!.nodes([shapeRef.current]);
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

    rectProps.onTransformEnd = () => {
      // the transformer scales the node; fold the scale into width and height
      const node = shapeRef.current;

      if (!node) {
        return;
      }

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      node.scaleX(1);
      node.scaleY(1);
      onChange({
        ...shapeProps,
        x: node.x(),
        y: node.y(),
        width: Math.max(MIN_RECT_SIDE_PIXEL, node.width() * scaleX),
        height: Math.max(MIN_RECT_SIDE_PIXEL, node.height() * scaleY),
      });
    };

    rectProps.onMouseOver = () => {
      document.body.style.cursor = "pointer";
    };
    rectProps.onMouseDown = () => {
      document.body.style.cursor = "grabbing";
    };
    rectProps.onMouseUp = () => {
      document.body.style.cursor = "grab";
    };
    rectProps.onMouseLeave = () => {
      document.body.style.cursor = "default";
    };
  }

  return (
    <Fragment>
      <Rect ref={shapeRef} {...rectProps} />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            const layerSize = shapeRef.current?.getLayer()?.getSize();
            const box = layerSize
              ? clampToImage(newBox, layerSize.width, layerSize.height)
              : newBox;

            if (
              box.width < MIN_RECT_SIDE_PIXEL ||
              box.height < MIN_RECT_SIDE_PIXEL
            ) {
              return oldBox;
            }

            return box;
          }}
        />
      )}
    </Fragment>
  );
};

export default Rectangle;
