import React from "react";
import noImage from "../../static/no-image.png";
import { styled } from "@mui/material/styles";

const Img = styled("img")({
  display: "block",
  marginLeft: "auto",
  marginRight: "auto",
  width: "50%",
});

// TODO: Use SVG and more specific text to describe reason...
export const NoImagePlaceholder: React.FunctionComponent = () => {
  return <Img src={noImage} alt="Not available" />;
};
