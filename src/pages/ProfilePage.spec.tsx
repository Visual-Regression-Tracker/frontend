import React from "react";
import ProfilePage from "./ProfilePage";
import {
  haveUserLogged,
  haveWindowsEnvSet,
} from "../_test/precondition.helper";
import { TEST_PROJECT, TEST_USER } from "../_test/test.data.helper";
import { mountVrtComponent } from "../_test/test.moun.helper";
import { projectStub } from "../_test/stub.helper";

describe("Profile page", () => {
  before(() => {
    haveUserLogged(TEST_USER);
    haveWindowsEnvSet({
      REACT_APP_API_URL: "http://localhost:4200",
      VRT_VERSION: "4.20.0",
    });
    projectStub.getAll([TEST_PROJECT]);
  });

  it("image", () => {
    mountVrtComponent({
      component: <ProfilePage />,
    });

    cy.vrtTrack("Profile page");
  });
});
