/* global cy */
import React from "react";
import LoginPage from "./LoginPage";
import { mountVrtComponent } from "../_test/test.moun.helper";
import { projectStub } from "../_test/stub.helper";

describe("Login page", () => {
  before(() => {
    projectStub.getAll([]);
  });
  it("image", () => {
    mountVrtComponent({
      component: <LoginPage />,
    });

    cy.vrtTrack("Login page");
  });
});
