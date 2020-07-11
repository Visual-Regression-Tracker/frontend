import React from "react";
import { Typography, Chip, Grid } from "@material-ui/core";
import { staticService } from "../services";
import useImage from "use-image";

interface IProps {
  type: "Baseline" | "Image" | "Diff";
  imageName: string;
  branchName: string;
}

const ImageDetails: React.FunctionComponent<IProps> = ({
  type,
  imageName,
  branchName,
}) => {
  const [image] = useImage(staticService.getImage(imageName));
  return (
    <React.Fragment>
      <Typography>{type}</Typography>
      {imageName ? (
        <React.Fragment>
          <Grid container spacing={2}>
            <Grid item>
              <Typography variant="caption">
                Real size: {`${image?.width} x ${image?.height}`}
              </Typography>
            </Grid>
            <Grid item>
              <Chip size="small" label={branchName} />
            </Grid>
          </Grid>
        </React.Fragment>
      ) : (
        <Typography variant="caption">No image</Typography>
      )}
    </React.Fragment>
  );
};

export default ImageDetails;
