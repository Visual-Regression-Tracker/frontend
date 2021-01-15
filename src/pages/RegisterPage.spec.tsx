/* global cy */
import React from "react";
import RegisterPage from "./RegisterPage";
import { mountVrtComponent } from "../_test/test.moun.helper";
import { projectStub } from "../_test/stub.helper";

describe("Register page", () => {
  before(() => {
    projectStub.getAll([]);
  });
  it("image", () => {
    mountVrtComponent({
      component: <RegisterPage />,
    });

    cy.vrtTrack("Register page");
  });
});
