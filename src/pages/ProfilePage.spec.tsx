/* global cy */
import React from "react";
import ProfilePage from "./ProfilePage";
import {
  haveUserLogged,
  haveWindowsEnvSet,
} from "../_test/precondition.helper";
import { PROJECT_ONE, userMock } from "../_test/test.data.helper";
import { mountVrtComponent } from "../_test/test.moun.helper";
import { projectStub } from "../_test/stub.helper";

describe("Profile page", () => {
  before(() => {
    haveUserLogged(userMock);
    haveWindowsEnvSet({
      REACT_APP_API_URL: "http://localhost:4200",
    });
    projectStub.getAll([PROJECT_ONE]);
  });

  it("image", () => {
    mountVrtComponent({
      component: <ProfilePage />,
    });

    cy.vrtTrack("Profile page");
  });
});
