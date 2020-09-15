/* global cy */
import React from "react";
import { mount } from "cypress-react-unit-test";
import LoginPage from "./LoginPage";
import { AuthProvider, AuthStateContext } from "../contexts";
import { BrowserRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";

describe("Login page", () => {
  it("image", () => {
    mount(
      <BrowserRouter>
        <SnackbarProvider>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </SnackbarProvider>
      </BrowserRouter>,
      {
        stylesheets: ["/__root/src/index.css"],
      }
    );

    cy.get("#cypress-root").vrtTrack("Login page");
  });
});
