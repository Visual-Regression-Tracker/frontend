import React from "react";
import { Box } from "@mui/material";
import UserList from "../components/UserList";

const UserListPage = () => {
  return (
    <Box mx={2} height={"95%"}>
      <UserList />
    </Box>
  );
};

export default UserListPage;
