import React from "react";
import { Typography, Chip, Grid, IconButton, Tooltip } from "@material-ui/core";
import { WarningRounded } from "@material-ui/icons";
import { staticService } from "../services";
import useImage from "use-image";
import { IgnoreArea } from "../types/ignoreArea";

interface IProps {
  type: "Baseline" | "Image" | "Diff";
  imageName: string;
  branchName: string;
  ignoreAreas?: IgnoreArea[];
}

const ImageDetails: React.FunctionComponent<IProps> = ({
  type,
  imageName,
  branchName,
  ignoreAreas,
}) => {
  const [image] = useImage(staticService.getImage(imageName));
  return (
    <React.Fragment>
      <Typography>{type}</Typography>
      {imageName ? (
        <React.Fragment>
          <Grid container spacing={2} alignItems={"center"}>
            <Grid item>
              <Typography variant="caption" data-testid="image-details">
                Real size: {`${image?.width} x ${image?.height}`}
              </Typography>
            </Grid>
            <Grid item>
              <Chip size="small" label={branchName} />
            </Grid>
            {ignoreAreas && ignoreAreas.length > 0 && (
              <Grid item>
                <Tooltip
                  title={
                    "Contains noneditable ignore areas applyed during image upload."
                  }
                >
                  <IconButton>
                    <WarningRounded color="secondary" />
                  </IconButton>
                </Tooltip>
              </Grid>
            )}
          </Grid>
        </React.Fragment>
      ) : (
        <Typography variant="caption">No image</Typography>
      )}
    </React.Fragment>
  );
};

export default ImageDetails;
