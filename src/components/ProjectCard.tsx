import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  AccountTree,
  Delete,
  Edit,
  Star,
  StarBorder,
} from "@mui/icons-material";
import { Tooltip } from "./Tooltip";
import { LOCATOR_PROJECT_LIST_PAGE_PROJECT_LIST, routes } from "../constants";
import { buildProjectPageUrl } from "../_helpers/route.helpers";
import { formatDateTime } from "../_helpers/format.helper";
import { Project } from "../types";

export const ProjectCard = ({
  project,
  favorite,
  onToggleFavorite,
  onEdit,
  onDelete,
}: {
  project: Project;
  favorite: boolean;
  onToggleFavorite: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) => {
  const favoriteLabel = favorite
    ? "Remove from favourites"
    : "Add to favourites";

  return (
    <Card
      id={LOCATOR_PROJECT_LIST_PAGE_PROJECT_LIST}
      data-testid={`project-${project.id}`}
      sx={{
        display: "flex",
        flexDirection: "column",
        "&:hover": { borderColor: "primary.main", boxShadow: 2 },
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1}>
          <Box flex={1} minWidth={0}>
            <Typography variant="h6" component="h3" noWrap>
              {project.name}
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              color="text.secondary"
              mt={0.5}
            >
              <AccountTree sx={{ fontSize: 16 }} />
              <Typography variant="body2" noWrap>
                {project.mainBranchName}
              </Typography>
            </Stack>
          </Box>
          <Tooltip title={favoriteLabel}>
            <IconButton
              aria-label={favoriteLabel}
              aria-pressed={favorite}
              onClick={onToggleFavorite}
              sx={{
                mt: -0.5,
                mr: -1,
                color: favorite ? "warning.main" : undefined,
              }}
            >
              {favorite ? (
                <Star data-testid="StarIcon" />
              ) : (
                <StarBorder data-testid="StarBorderIcon" />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
        <Box
          component="dl"
          sx={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            columnGap: 2,
            rowGap: 0.5,
            m: 0,
            mt: 2,
            "& dt": { color: "text.secondary" },
            "& dd": { m: 0, minWidth: 0, overflowWrap: "anywhere" },
          }}
        >
          <Typography component="dt" variant="caption">
            Id
          </Typography>
          <Typography component="dd" variant="caption">
            {project.id}
          </Typography>
          <Typography component="dt" variant="caption">
            Created
          </Typography>
          <Typography component="dd" variant="caption">
            {formatDateTime(project.createdAt)}
          </Typography>
        </Box>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          variant="contained"
          size="small"
          component={RouterLink}
          to={buildProjectPageUrl(project.id)}
        >
          Builds
        </Button>
        <Button
          variant="outlined"
          size="small"
          component={RouterLink}
          to={`${routes.VARIATION_LIST_PAGE}/${project.id}`}
        >
          Variations
        </Button>
        <Box flex={1} />
        {onEdit && (
          <Tooltip title="Edit project">
            <IconButton onClick={onEdit}>
              <Edit data-testid="EditIcon" fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip title="Delete project">
            <IconButton onClick={onDelete} data-testid="delete">
              <Delete data-testid="DeleteIcon" fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};
