import { Container } from "@mui/material";
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
        subtitle={`${userList.length} ${pluralize(userList.length, "person", "people")}`}
      />
      <UserList />
    </Container>
  );
};

export default UserListPage;
