import React from "react";
import { Typography, GridLegacy as Grid, IconButton } from "@mui/material";
import { WarningRounded, AltRoute } from "@mui/icons-material";
import { IgnoreArea } from "../../types/ignoreArea";
import { Tooltip } from "../Tooltip";
import { styled } from "@mui/material/styles";

const BranchName = styled("span")({
  cursor: "pointer",
  lineHeight: "20px",
  fontWeight: "bolder",
  fontSize: "0.7rem",
  maxWidth: 195,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  overflow: "hidden",
});

export interface ImageDetailsProps {
  type: "Baseline" | "Image" | "Diff";
  // nullable like the run's own names: this already renders "Loading..." for a
  // missing one, so the guard was there before the type admitted it
  imageName: string | null;
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
          data-testid="image-size"
        >
          {image ? `(${image?.width} x ${image?.height})` : "Loading..."}
        </Typography>
      )
    );
  };
  return (
    <Grid
      item
      sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}
    >
      <Typography variant="overline" style={{ marginRight: 3 }}>
        {type === "Baseline" ? "Baseline" : "Checkpoint"}
      </Typography>
      {imageSize()}
      <AltRoute fontSize="small" />
      <Tooltip title={`Branch: ${branchName}`}>
        <BranchName>{branchName}</BranchName>
      </Tooltip>
      {ignoreAreas && ignoreAreas.length > 0 && (
        <Tooltip
          title={
            "Contains noneditable ignore areas applied during image upload."
          }
        >
          <IconButton size="large">
            <WarningRounded
              data-testid="WarningRoundedIcon"
              color="secondary"
            />
          </IconButton>
        </Tooltip>
      )}
    </Grid>
  );
};

export default ImageDetails;
