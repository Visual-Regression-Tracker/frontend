import React from "react";
import { Typography, Grid, IconButton, makeStyles } from "@material-ui/core";
import { WarningRounded } from "@material-ui/icons";
import { IgnoreArea } from "../../types/ignoreArea";
import { Tooltip } from "../Tooltip";
import AltRouteIcon from "@mui/icons-material/AltRoute";

interface IProps {
  type: "Baseline" | "Image" | "Diff";
  imageName: string;
  image: undefined | HTMLImageElement;
  branchName: string;
  ignoreAreas?: IgnoreArea[];
}

const useStyles = makeStyles((theme) => ({
  container: {
    display: "flex",
    alignItems: "center",
    color: "darkslategrey",
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

const ImageDetails: React.FunctionComponent<IProps> = ({
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
          style={{ marginRight: 3, fontSize: "0.7rem" }}
          data-testid="image-size"
        >
          {image ? `(${image?.width} x ${image?.height})` : "Loading..."}
        </Typography>
      )
    );
  };
  return (
    <React.Fragment>
      <Grid item className={classes.container}>
        <Typography variant="overline" style={{ marginRight: 3 }}>
          {type === "Baseline" ? "Baseline" : "Checkpoint"}
        </Typography>
        {imageSize()}
        <AltRouteIcon fontSize="small" />
        <Tooltip title={`Branch: ${branchName}`}>
          <span className={classes.branchName}>{branchName}</span>
        </Tooltip>
        {ignoreAreas && ignoreAreas.length > 0 && (
          <Tooltip
            title={
              "Contains noneditable ignore areas applied during image upload."
            }
          >
            <IconButton>
              <WarningRounded color="secondary" />
            </IconButton>
          </Tooltip>
        )}
      </Grid>
    </React.Fragment>
  );
};

export default ImageDetails;
