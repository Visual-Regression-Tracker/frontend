/* global cy */
import React from "react";
import ProjectListPage from "./ProjectListPage";
import { haveUserLogged } from "../_test/precondition.helper";
import { PROJECT_ONE, userMock } from "../_test/test.data.helper";
import { mountVrtComponent } from "../_test/test.moun.helper";
import { projectStub } from "../_test/stub.helper";

describe("Project List page", () => {
  before(() => {
    haveUserLogged(userMock);
  });

  it("image", () => {
    projectStub.getAll([PROJECT_ONE]);

    mountVrtComponent({
      component: <ProjectListPage />,
    });

    cy.vrtTrack("Project List page");
  });
});
