import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Card,
  CardActions,
  CardContent,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import {
  AccountTree,
  Delete,
  Settings,
  Star,
  StarBorder,
} from "@mui/icons-material";
import { Tooltip } from "./Tooltip";
import { LOCATOR_PROJECT_LIST_PAGE_PROJECT_LIST } from "../constants";
import { buildProjectPageUrl } from "../_helpers/route.helpers";
import { DateLabel } from "./DateLabel";
import { Project } from "../types";
import { TEST_ID } from "../constants/locators";

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
        position: "relative",
        "& .MuiIconButton-root": { position: "relative", zIndex: 1 },
        display: "flex",
        flexDirection: "column",
        "&:hover, &:focus-within": {
          borderColor: "primary.main",
          boxShadow: 2,
        },
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" component="h3" noWrap>
              <Link
                component={RouterLink}
                to={buildProjectPageUrl(project.id)}
                color="inherit"
                underline="none"
                sx={{
                  "&::after": { content: '""', position: "absolute", inset: 0 },
                }}
              >
                {project.name}
              </Link>
            </Typography>
            <Stack
              direction="row"
              spacing={0.75}
              sx={{ alignItems: "center", color: "text.secondary", mt: 0.5 }}
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
            Created
          </Typography>
          <Typography component="dd" variant="caption">
            <DateLabel date={project.createdAt} />
          </Typography>
        </Box>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Box sx={{ flex: 1 }} />
        {onEdit && (
          <Tooltip title="Project settings">
            <IconButton onClick={onEdit} aria-label="Project settings">
              <Settings data-testid={TEST_ID.settingsIcon} fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip title="Delete project">
            <IconButton onClick={onDelete} data-testid={TEST_ID.delete}>
              <Delete data-testid={TEST_ID.deleteIcon} fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};
