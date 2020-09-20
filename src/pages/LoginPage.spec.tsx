/* global cy */
import React from "react";
import { mount } from "cypress-react-unit-test";
import LoginPage from "./LoginPage";
import { AuthProvider, AuthStateContext } from "../contexts";
import { BrowserRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { mountVrtComponent } from "../_helpers/test.moun.helper";

describe("Login page", () => {
  it("image", () => {
    mountVrtComponent({
      component: <LoginPage />,
    });

    cy.get("#cypress-root").vrtTrack("Login page");
  });
});
