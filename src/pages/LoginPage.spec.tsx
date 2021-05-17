/* global cy */
import React from "react";
import LoginPage from "./LoginPage";
import { mountVrtComponent } from "../_test/test.moun.helper";

describe("Login page", () => {
  it("image", () => {
    mountVrtComponent({
      component: <LoginPage />,
    });

    // cy.vrtTrack("Login page");
    cy.screenshot();
  });
});
