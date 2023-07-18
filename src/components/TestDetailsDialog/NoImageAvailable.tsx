import React from "react";
import { makeStyles } from "@mui/styles";
import noImage from "../../static/no-image.png";

const useStyles = makeStyles((theme) => ({
  img: {
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
    width: "50%",
  },
}));

export const NoImagePlaceholder: React.FunctionComponent = () => {
  const classes = useStyles();

  return <img src={noImage} alt="Not available" className={classes.img} />;
};
