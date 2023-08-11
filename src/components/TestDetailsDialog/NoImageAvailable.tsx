import React from "react";
import noImage from "../../static/no-image.png";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles(() => ({
  img: {
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
    width: "50%",
  },
}));

// TODO: Use SVG and more specific text to describe reason...
export const NoImagePlaceholder: React.FunctionComponent = () => {
  const classes = useStyles();

  return <img src={noImage} alt="Not available" className={classes.img} />;
};
