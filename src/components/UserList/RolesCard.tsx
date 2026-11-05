import { Paper, Stack, Typography } from "@mui/material";

const ROLES = [
  {
    name: "Admin",
    description: "Everything Editor can do, plus users and roles.",
  },
  {
    name: "Editor",
    description:
      "Approve, reject and undo, ignore areas, projects and their settings.",
  },
  { name: "Guest", description: "View only. New sign-ups start here." },
];

export const RolesCard = () => (
  <Paper
    variant="outlined"
    component="section"
    aria-labelledby="roles-card-title"
    sx={{ p: 2, alignSelf: "flex-start" }}
  >
    <Typography id="roles-card-title" variant="subtitle1" component="h2">
      Roles
    </Typography>
    <Stack sx={{ gap: 1, mt: 1 }}>
      {ROLES.map(({ name, description }) => (
        <div key={name}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {name}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {description}
          </Typography>
        </div>
      ))}
    </Stack>
  </Paper>
);
