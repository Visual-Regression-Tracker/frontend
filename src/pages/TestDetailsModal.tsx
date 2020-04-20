import React, {
  FunctionComponent,
  useRef,
  useLayoutEffect,
  useState,
} from "react";
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Slide,
  Container,
  Grid,
} from "@material-ui/core";
import { Close } from "@material-ui/icons";
import { Test } from "../types";
import { TransitionProps } from "@material-ui/core/transitions/transition";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { Stage, Layer, Star, Text, Image } from "react-konva";
import useImage from "use-image";
import { staticService } from "../services";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    appBar: {
      position: "relative",
    },
    title: {
      marginLeft: theme.spacing(2),
      flex: 1,
    },
  })
);

interface IProps {
  test: Test;
  onClose: () => void;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children?: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const TestDetailsModal: FunctionComponent<IProps> = ({ test, onClose }) => {
  const classes = useStyles();
  const [baseline] = useImage(staticService.getImage(test.baselineUrl));
  const [diff] = useImage(staticService.getImage(test.diffUrl));
  const [image] = useImage(staticService.getImage(test.imageUrl));

  const targetRef = useRef<HTMLAreaElement>();
  // const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  // useLayoutEffect(() => {
  //   if (targetRef.current) {
  //     setDimensions({
  //       width: targetRef.current.offsetWidth,
  //       height: targetRef.current.offsetHeight,
  //     });
  //   }
  // }, []);

  return (
    <Dialog
      fullScreen
      open={!!test}
      onClose={onClose}
      TransitionComponent={Transition}
    >
      <AppBar className={classes.appBar}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose}>
            <Close />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            {test.name}
          </Typography>
          <Button autoFocus color="inherit" onClick={onClose}>
            save
          </Button>
        </Toolbar>
      </AppBar>
      <Grid container spacing={2}>
        <Grid item xs={6} innerRef={targetRef}>
          <Stage width={targetRef.current?.offsetWidth} height={baseline?.height}>
            <Layer>
              <Image draggable scale={{x: 0.5, y: 0.5}} image={baseline} />
            </Layer>
          </Stage>
        </Grid>
        <Grid item xs={6}>
        <Stage width={targetRef.current?.offsetWidth} height={image?.height}>
            <Layer>
              <Image draggable image={image} />
            </Layer>
          </Stage>
        </Grid>
      </Grid>
      {/* <Stage width={baseline?.width} height={baseline?.height}>
        <Layer>
          <Image draggable image={baseline} />
        </Layer>
      </Stage> */}
    </Dialog>
  );
};

export default TestDetailsModal;
