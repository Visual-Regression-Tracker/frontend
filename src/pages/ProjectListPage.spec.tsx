/* global cy */
import React from "react";
import ProjectListPage from "./ProjectListPage";
import { projectsService } from "../services";
import { haveUserLogged } from "../_helpers/precondition.helper";
import { userMock } from "../_helpers/testData.helper";
import { mountVrtComponent } from "../_helpers/test.moun.helper";

describe("Project List page", () => {
  before(() => {
    haveUserLogged(userMock);
  });

  it("image", () => {
    cy.stub(projectsService, "getAll").resolves([
      {
        id: "some id",
        name: "Project name",
        mainBranchName: "Main branch name",
        builds: [],
        updatedAt: "2020-09-14T06:57:25.845Z",
        createdAt: "2020-09-14T06:57:25.845Z",
      },
    ]);

    mountVrtComponent({
      component: <ProjectListPage />,
    });

    cy.get("#cypress-root").vrtTrack("Project List page");
  });
});
