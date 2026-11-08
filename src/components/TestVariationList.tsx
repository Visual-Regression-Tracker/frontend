import { useState } from "react";
import { Link } from "react-router-dom";
import { TestVariation } from "../types";
import { staticService } from "../services";
import { routes } from "../constants";
import { BaseModal } from "./BaseModal";
import { CommentIndicator } from "./CommentIndicator";
import { EmptyState } from "./EmptyState";
import { TagLine } from "./TagLine";
import { Tooltip } from "./Tooltip";
import { imageSurface } from "../theme/tokens";
import { AccountTree, CollectionsOutlined, Delete } from "@mui/icons-material";
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

interface IProps {
  items: TestVariation[];
  onDeleteClick: (id: string) => void;
}

const branchSx = {
  alignItems: "center",
  color: "text.secondary",
  mt: 1.5,
} as const;

const TestVariationList = ({ items, onDeleteClick }: IProps) => {
  const [selectedItem, setSelectedItem] = useState<TestVariation | null>(null);

  const handleClose = () => {
    setSelectedItem(null);
  };

  return (
    <>
      {items.length === 0 && (
        <EmptyState
          icon={<CollectionsOutlined />}
          title="No variations"
          description="A variation appears once a build sends its first screenshot of a screen."
        />
      )}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        }}
      >
        {items.map((t) => (
          <Card
            key={t.id}
            sx={{
              display: "flex",
              flexDirection: "column",
              "&:hover": { borderColor: "primary.main", boxShadow: 2 },
            }}
          >
            <CardMedia
              component="img"
              sx={{
                height: 160,
                objectFit: "contain",
                bgcolor: imageSurface.thumbnail,
                borderBottom: 1,
                borderColor: "divider",
              }}
              image={staticService.getImage(t.baselineName)}
              title={t.name}
            />
            <CardContent sx={{ flex: 1 }}>
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ alignItems: "center" }}
              >
                <Typography
                  variant="subtitle2"
                  component="h2"
                  sx={{ overflowWrap: "anywhere", minWidth: 0 }}
                >
                  {t.name}
                </Typography>
                <CommentIndicator text={t.comment} />
              </Stack>
              <Box sx={{ mt: 0.5 }}>
                <TagLine tags={t} />
              </Box>
              <Stack direction="row" spacing={0.75} sx={branchSx}>
                <AccountTree sx={{ fontSize: 16 }} />
                <Typography variant="caption" noWrap>
                  {t.branchName}
                </Typography>
              </Stack>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                component={Link}
                to={`${routes.VARIATION_DETAILS_PAGE}/${t.id}`}
              >
                History
              </Button>
              <Box sx={{ flex: 1 }} />
              <Tooltip title="Delete variation">
                <IconButton onClick={() => setSelectedItem(t)}>
                  <Delete data-testid="DeleteIcon" fontSize="small" />
                </IconButton>
              </Tooltip>
            </CardActions>
          </Card>
        ))}
      </Box>

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
    </>
  );
};

export default TestVariationList;
