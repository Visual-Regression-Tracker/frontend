import React from "react";
import { TestVariation } from "../types";
import {
  Card,
  Grid,
  CardMedia,
  CardContent,
  Typography,
  makeStyles,
  CardActions,
  Button,
} from "@material-ui/core";
import { staticService } from "../services";
import { Link } from "react-router-dom";
import { routes } from "../constants";

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
            <CardActions>
              <Button
                color="primary"
                component={Link}
                to={`${routes.VARIATION_DETAILS_PAGE}/${t.id}`}
              >
                History
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default TestVariationList;
