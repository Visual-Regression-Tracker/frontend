/* global cy */
import React from "react";
import { mountVrtComponent } from "../_test/test.moun.helper";
import {
  EDITOR_USER,
  TEST_USER,
  GUEST_USER,
  TEST_PROJECT,
} from "../_test/test.data.helper";
import UserListPage from "./UserListPage";
import { projectStub, userStub } from "../_test/stub.helper";
import { haveUserLogged } from "../_test/precondition.helper";

describe("UserListPage", () => {
  before(() => {
    haveUserLogged(TEST_USER);
    projectStub.getAll([TEST_PROJECT]);
    userStub.getAll([TEST_USER, GUEST_USER, EDITOR_USER]);
  });

  it("image", () => {
    mountVrtComponent({
      component: <UserListPage />,
    });

    cy.vrtTrack("UserList page");
  });
});
