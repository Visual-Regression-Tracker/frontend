import React from "react";
import { styled } from "@mui/material/styles";
import noImage from "../../static/no-image.png";

const PREFIX = "NoImagePlaceholder";

const classes = {
  img: `${PREFIX}-img`,
};

const Root = styled("img")(() => ({
  [`&.${classes.img}`]: {
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
    width: "fit-content",
  },
}));

// TODO: Use SVG and more specific text to describe reason...
export const NoImagePlaceholder: React.FunctionComponent = () => {
  return <Root src={noImage} alt="Not available" className={classes.img} />;
};
