/* global cy */
import React from "react";
import RegisterPage from "./RegisterPage";
import { mountVrtComponent } from "../_test/test.moun.helper";

describe("Register page", () => {
  it("image", () => {
    mountVrtComponent({
      component: <RegisterPage />,
    });

    cy.get("#cypress-root").vrtTrack("Register page");
  });
});
