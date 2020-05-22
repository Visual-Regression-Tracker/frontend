import React from "react";
import { TestVariation } from "../types";
import {
  Card,
  Grid,
  CardMedia,
  CardContent,
  Typography,
  makeStyles,
} from "@material-ui/core";
import { staticService } from "../services";

interface IProps {
  items: TestVariation[];
}

const useStyles = makeStyles({
  card: {
    maxWidth: 345,
  },
  media: {
    height: 140,
  },
});

const TestVariationList: React.FunctionComponent<IProps> = ({ items }) => {
  const classes = useStyles();

  return (
    <Grid container>
      {items.map((t) => (
        <Grid item key={t.id} xs={4}>
          <Card className={classes.card}>
            <CardMedia
              className={classes.media}
              image={staticService.getImage(t.baselineName)}
              title={t.name}
            />
            <CardContent>
              <Typography>{t.name}</Typography>

              <Grid container spacing={2}>
                <Grid item>
                  <Typography>OS: {t.os}</Typography>
                </Grid>
                <Grid item>
                  <Typography>Browser: {t.browser}</Typography>
                </Grid>
                <Grid item>
                  <Typography>Viewport: {t.viewport}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default TestVariationList;
