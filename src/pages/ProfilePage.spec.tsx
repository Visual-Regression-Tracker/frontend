/* global cy */
import React from "react";
import ProfilePage from "./ProfilePage";
import { haveUserLogged } from "../_helpers/precondition.helper";
import { userMock } from "../_helpers/testData.helper";
import { mountVrtComponent } from "../_helpers/test.moun.helper";

describe("Profile page", () => {
  before(() => {
    haveUserLogged(userMock);
  });

  it("image", () => {
    mountVrtComponent({
      component: <ProfilePage />,
    });

    cy.get("#cypress-root").vrtTrack("Profile page");
  });
});
