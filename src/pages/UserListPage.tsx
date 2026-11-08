import { PageContainer } from "../components/PageContainer";
import UserList from "../components/UserList";
import { PageHeader } from "../components/PageHeader";
import { useUserState } from "../contexts";
import { pluralize } from "../_helpers/format.helper";

const UserListPage = () => {
  const { userList } = useUserState();

  return (
    <PageContainer fill>
      <PageHeader
        title="Users"
        subtitle={`${userList.length} ${pluralize(userList.length, "person", "people")}`}
      />
      <UserList />
    </PageContainer>
  );
};

export default UserListPage;
