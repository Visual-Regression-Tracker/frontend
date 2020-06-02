import React from "react";
import { Rect, Transformer } from "react-konva";

const Rectangle = ({ shapeProps, isSelected, onSelect, onChange }) => {
  const shapeRef = React.useRef();
  const trRef = React.useRef();

  React.useEffect(() => {
    if (isSelected) {
      // we need to attach transformer manually
      trRef.current.setNode(shapeRef.current);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <Rect
        fill={"gray"}
        opacity={0.4}
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        draggable
        dragBoundFunc={(pos) => {
          const component = shapeRef.current;

          const rectWidth = component.width() * component.scaleX();
          const rectHeight = component.height() * component.scaleY();
          const layerSize = component.getLayer().getSize();

          return {
            x: pos.x > 0 ? Math.min(layerSize.width - rectWidth, pos.x) : 0,
            y: pos.y > 0 ? Math.min(layerSize.height - rectHeight, pos.y) : 0,
          };
        }}
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          // transformer is changing scale of the node
          // and NOT its width or height
          // but in the store we have only width and height
          // to match the data better we will reset scale on transform end
          const node = shapeRef.current;
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
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
          });
        }}
        onMouseOver={(event) => {
          document.body.style.cursor = "pointer";
        }}
        onMouseDown={(event) => {
          document.body.style.cursor = "grabbing";
        }}
        onMouseUp={(event) => {
          document.body.style.cursor = "grab";
        }}
        onMouseLeave={(event) => {
          document.body.style.cursor = "default";
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (newBox.width < 5 || newBox.height < 5) {
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
