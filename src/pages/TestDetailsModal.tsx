import React, { FunctionComponent, useState } from "react";
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Slide,
  Grid,
  Switch,
} from "@material-ui/core";
import { Close } from "@material-ui/icons";
import { Test } from "../types";
import { TransitionProps } from "@material-ui/core/transitions/transition";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import useImage from "use-image";
import { staticService } from "../services";
import DrawArea from "../components/DrawArea";
import { RectConfig } from "konva/types/shapes/Rect";

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
  const [isDiffShown, setIsDiffShown] = useState(true);
  const [baseline] = useImage(staticService.getImage(test.baselineUrl));
  const [diff] = useImage(staticService.getImage(test.diffUrl));
  const [image] = useImage(staticService.getImage(test.imageUrl));
  const stageWidth = (window.innerWidth / 2) * 0.95;
  const stageHeigth = window.innerHeight;

  const list: RectConfig[] = [
    {
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      id: 'rect1'
    },
    {
      x: 150,
      y: 150,
      width: 100,
      height: 100,
      id: 'rect2'
    }
  ];
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
          <Grid container justify="space-between">
            <Grid item>
              <Typography variant="h6" className={classes.title}>
                {test.name}
              </Typography>
            </Grid>
            <Grid item>
              <Switch
                checked={isDiffShown}
                onChange={() => setIsDiffShown(!isDiffShown)}
                name="Show diff"
              />
            </Grid>
            <Grid item>
              <Button autoFocus color="inherit" onClick={onClose}>
                save
              </Button>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      <Grid container>
        <Grid item xs={6}>
          {baseline && (
            <DrawArea
              width={stageWidth}
              height={stageHeigth}
              image={baseline}
              list={[]}
            />
          )}
        </Grid>
        <Grid item xs={6}>
          {isDiffShown
            ? diff && (
                <DrawArea
                  width={stageWidth}
                  height={stageHeigth}
                  image={diff}
                  list={list}
                />
              )
            : image && (
                <DrawArea
                  width={stageWidth}
                  height={stageHeigth}
                  image={image}
                  list={list}
                />
              )}
        </Grid>
      </Grid>
    </Dialog>
  );
};

export default TestDetailsModal;
