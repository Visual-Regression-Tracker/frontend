import React from "react";
import ProjectListPage from "./ProjectListPage";
import { haveUserLogged } from "../_test/precondition.helper";
import { TEST_PROJECT, TEST_USER } from "../_test/test.data.helper";
import { mountVrtComponent } from "../_test/test.moun.helper";
import { projectStub } from "../_test/stub.helper";

describe("Project List page", () => {
  it("image", () => {
    haveUserLogged(TEST_USER);
    projectStub.getAll([TEST_PROJECT]);

    mountVrtComponent({
      component: <ProjectListPage />,
    });

    cy.vrtTrack("Project List page");
  });
});
