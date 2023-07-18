import React from "react";
import { styled } from '@mui/material/styles';
import { Typography, Grid, IconButton } from "@mui/material";
import { WarningRounded, AltRoute } from "@mui/icons-material";
import { IgnoreArea } from "../../types/ignoreArea";
import { Tooltip } from "../Tooltip";

const PREFIX = 'ImageDetails';

const classes = {
  container: `${PREFIX}-container`,
  branchName: `${PREFIX}-branchName`
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(() => ({
  [`& .${classes.container}`]: {
    display: "flex",
    alignItems: "center",
    color: "darkslategrey",
  },

  [`& .${classes.branchName}`]: {
    cursor: "pointer",
    lineHeight: "20px",
    fontWeight: "bolder",
    fontSize: "0.7rem",
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    maxWidth: 195,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    overflow: "hidden",
  }
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

  const imageSize = () => {
    return (
      imageName && (
        <Typography
          variant="caption"
          style={{ marginRight: 3, fontSize: "0.7rem" }}
          data-testId="image-size"
        >
          {image ? `(${image?.width} x ${image?.height})` : "Loading..."}
        </Typography>
      )
    );
  };
  return (
    <Root>
      <Grid item className={classes.container}>
        <Typography variant="overline" style={{ marginRight: 3 }}>
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
    </Root>
  );
};

export default ImageDetails;
