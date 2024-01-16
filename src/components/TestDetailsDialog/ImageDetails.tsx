import React from "react";
import { Typography, Grid, IconButton } from "@mui/material";
import { WarningRounded, AltRoute } from "@mui/icons-material";
import { IgnoreArea } from "../../types/ignoreArea";
import { Tooltip } from "../Tooltip";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles(() => ({
  container: {
    display: "flex",
    alignItems: "center",
  },
  branchName: {
    cursor: "pointer",
    lineHeight: "20px",
    fontWeight: "bolder",
    fontSize: "0.7rem",
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    maxWidth: 195,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
}));

export interface ImageDetailsProps {
  type: "Baseline" | "Image" | "Diff";
  imageName: string;
  image: HTMLImageElement | undefined;
  branchName: string;
  ignoreAreas?: IgnoreArea[];
}

const ImageDetails: React.FunctionComponent<ImageDetailsProps> = ({
  type,
  image,
  imageName,
  branchName,
  ignoreAreas,
}) => {
  const classes = useStyles();
  const imageSize = () => {
    return (
      imageName && (
        <Typography
          variant="caption"
          sx={{mr: 0.5, fontSize: "0.7rem"}}
          data-testid="image-size"
        >
          {image ? `(${image?.width} x ${image?.height})` : "Loading..."}
        </Typography>
      )
    );
  };
  return (
    <Grid item className={classes.container}>
      <Typography variant="overline" sx={{mr: 0.5}}>
        {type === "Baseline" ? "Baseline" : "Checkpoint"}
      </Typography>
      {imageSize()}
      <AltRoute fontSize="small" />
      <Tooltip title={`Branch: ${branchName}`}>
        <span className={classes.branchName}>{branchName}</span>
      </Tooltip>
      {ignoreAreas && ignoreAreas.length > 0 && (
        <Tooltip
          title={
            "Contains noneditable ignore areas applied during image upload."
          }
        >
          <IconButton size="large">
            <WarningRounded color="secondary" />
          </IconButton>
        </Tooltip>
      )}
    </Grid>
  );
};

export default ImageDetails;
