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
import { staticService, testsService } from "../services";
import DrawArea from "../components/DrawArea";
import { TestStatus } from "../types/testStatus";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    appBar: {
      position: "relative",
    },
  })
);

interface IProps {
  testDetails: Test;
  onClose: () => void;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children?: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const TestDetailsModal: FunctionComponent<IProps> = ({
  testDetails,
  onClose,
}) => {
  const classes = useStyles();
  const [test, setTest] = useState(testDetails);
  const [isDiffShown, setIsDiffShown] = useState(false);
  const [baseline] = useImage(staticService.getImage(test.baselineUrl));
  const [diff] = useImage(staticService.getImage(test.diffUrl));
  const [image] = useImage(staticService.getImage(test.imageUrl));
  const stageWidth = (window.innerWidth / 2) * 0.95;
  const stageHeigth = window.innerHeight;

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
              <Typography variant="h6">{test.name}</Typography>
            </Grid>
            {test.status === TestStatus.unresolved && (
              <Grid item>
                <Switch
                  checked={isDiffShown}
                  onChange={() => setIsDiffShown(!isDiffShown)}
                  name="Show diff"
                />
              </Grid>
            )}
            {(test.status === TestStatus.unresolved ||
              test.status === TestStatus.new) && (
              <Grid item>
                <Button
                  color="inherit"
                  onClick={() =>
                    testsService.approve(test.id).then((test) => setTest(test))
                  }
                >
                  Approve
                </Button>
                <Button
                  color="secondary"
                  onClick={() =>
                    testsService.reject(test.id).then((test) => setTest(test))
                  }
                >
                  Reject
                </Button>
              </Grid>
            )}
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
              ignoreAreas={[]}
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
                  ignoreAreas={[]}
                />
              )
            : image && (
                <DrawArea
                  width={stageWidth}
                  height={stageHeigth}
                  image={image}
                  ignoreAreas={[]}
                />
              )}
        </Grid>
      </Grid>
    </Dialog>
  );
};

export default TestDetailsModal;
