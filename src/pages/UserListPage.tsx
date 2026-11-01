import { Container, Paper } from "@mui/material";
import UserList from "../components/UserList";
import { PageHeader } from "../components/PageHeader";
import { useUserState } from "../contexts";
import { pluralize } from "../_helpers/format.helper";

const UserListPage = () => {
  const { userList } = useUserState();

  return (
    <Container
      maxWidth="xl"
      sx={{ py: 4, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <PageHeader
        title="Users"
        subtitle={`${userList.length} ${pluralize(userList.length, "user")} · double-click a role to change it`}
      />
      <Paper
        variant="outlined"
        sx={{ flex: 1, minHeight: 360, overflow: "hidden" }}
      >
        <UserList />
      </Paper>
    </Container>
  );
};

export default UserListPage;
