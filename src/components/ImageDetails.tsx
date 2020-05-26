import React from "react";
import { Typography } from "@material-ui/core";
import { staticService } from "../services";
import useImage from "use-image";

interface IProps {
  type: "Baseline" | "Image" | "Diff";
  imageName: string;
}

const ImageDetails: React.FunctionComponent<IProps> = ({ type, imageName }) => {
  const [image] = useImage(staticService.getImage(imageName));
  return (
    <React.Fragment>
      <Typography>{type}</Typography>
      {imageName ? (
        <React.Fragment>
          <Typography variant='caption'>Real size: {`${image?.width} x ${image?.height}`}</Typography>
        </React.Fragment>
      ) : (
        <Typography variant='caption'>No image</Typography>
      )}
    </React.Fragment>
  );
};

export default ImageDetails;
