import React from "react";
import { TestVariation } from "../types";
import {
  Card,
  Grid,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { staticService } from "../services";
import { Link } from "react-router-dom";
import { routes } from "../constants";
import { TestVariationDetails } from "./TestVariationDetails";
import { Delete } from "@mui/icons-material";
import { BaseModal } from "./BaseModal";

interface IProps {
  items: TestVariation[];
  onDeleteClick: (id: string) => void;
}

const useStyles = makeStyles({
  card: {
    maxWidth: 345,
  },
  media: {
    height: 140,
    objectFit: "contain",
  },
});

const TestVariationList: React.FunctionComponent<IProps> = ({
  items,
  onDeleteClick,
}) => {
  const classes = useStyles();
  const [selectedItem, setSelectedItem] = React.useState<TestVariation | null>(
    null,
  );

  const handleClose = () => {
    setSelectedItem(null);
  };

  return (
    <React.Fragment>
      <Grid container>
        {items.length === 0 && (
          <Typography variant="h5">No variations</Typography>
        )}
        {items.map((t) => (
          <Grid item key={t.id} xs={4}>
            <Card className={classes.card}>
              <CardMedia
                component="img"
                className={classes.media}
                image={staticService.getImage(t.baselineName)}
                title={t.name}
              />
              <CardContent>
                <TestVariationDetails testVariation={t} />
              </CardContent>
              <CardActions>
                <Button
                  color="primary"
                  component={Link}
                  to={`${routes.VARIATION_DETAILS_PAGE}/${t.id}`}
                >
                  History
                </Button>
                <IconButton
                  onClick={(event: React.MouseEvent<HTMLElement>) =>
                    setSelectedItem(t)
                  }
                  size="large"
                >
                  <Delete />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedItem && (
        <BaseModal
          open={!!selectedItem}
          title={"Delete TestVariation"}
          submitButtonText={"Delete"}
          onCancel={handleClose}
          content={
            <Typography>{`Are you sure you want to delete: ${selectedItem.name}?`}</Typography>
          }
          onSubmit={() => {
            onDeleteClick(selectedItem.id);
            handleClose();
          }}
        />
      )}
    </React.Fragment>
  );
};

export default TestVariationList;
