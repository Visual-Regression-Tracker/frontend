import React from "react";
import { Typography, Chip, Grid, IconButton, withStyles, colors, makeStyles } from "@material-ui/core";
import { WarningRounded } from "@material-ui/icons";
import { staticService } from "../services";
import useImage from "use-image";
import { IgnoreArea } from "../types/ignoreArea";
import { Tooltip } from "./Tooltip";
import AltRouteIcon from '@mui/icons-material/AltRoute';

interface IProps {
  type: "Baseline" | "Image" | "Diff";
  imageName: string;
  branchName: string;
  ignoreAreas?: IgnoreArea[];
}
const ColoredChip = withStyles({
  root: {
    backgroundColor:'whitesmoke',
    lineHeight:20,
    color:'#3f51b5',
    fontWeight:"bolder",
    fontSize:"0.7rem"
  }
})(Chip);

const useStyles = makeStyles((theme) => ({
  branchName: {
    cursor:"pointer",
    lineHeight:"20px",
    // color:'#3f51b5',
    fontWeight:"bolder",
    fontSize:"0.7rem",
    fontFamily:'"Roboto", "Helvetica", "Arial", sans-serif'
  },
}))

const ImageDetails: React.FunctionComponent<IProps> = ({
  type,
  imageName,
  branchName,
  ignoreAreas,
}) => {
  const classes = useStyles();
  const [image] = useImage(staticService.getImage(imageName));
  return (
    <React.Fragment>
      {imageName ? (
        <React.Fragment>
            <Grid item style={{paddingLeft:0,color:"darkslategrey"}}>
              <Typography variant="caption" style={{fontSize:"0.7rem"}}>
                  {image?`(${image?.width} x ${image?.height})`:"Loading..."}
              </Typography>
            </Grid>
            <Grid item style={{padding:0, display:"flex",color:"darkslategrey"}}>
              <AltRouteIcon fontSize="small"/>  
              <span className={classes.branchName}>{branchName}</span>
            </Grid>
            {/* <Grid item>
              <Typography variant="caption" data-testid="image-details">
              {image?`Real size: ${image?.width} x ${image?.height}`:"Loading..."}
              </Typography>
            </Grid> */}
            {ignoreAreas && ignoreAreas.length > 0 && (
              <Grid item>
                <Tooltip
                  title={
                    "Contains noneditable ignore areas applied during image upload."
                  }
                >
                  <IconButton>
                    <WarningRounded color="secondary" />
                  </IconButton>
                </Tooltip>
              </Grid>
            )}
        </React.Fragment>
      ) : (
        <Typography variant="caption">No image</Typography>
      )}
    </React.Fragment>
  );
};

export default ImageDetails;
