import React from "react";
import { makeStyles } from "@material-ui/core";

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

  return (
    <img src="/no-image.png" alt="Not available" className={classes.img} />
  );
};
