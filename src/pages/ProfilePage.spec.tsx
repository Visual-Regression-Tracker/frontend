/* global cy */
import React from "react";
import { mount } from "cypress-react-unit-test";
import ProfilePage from "./ProfilePage";
import { AuthProvider } from "../contexts";
import { BrowserRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { haveUserLogged } from "../_helpers/precondition.helper";
import { userMock } from "../_helpers/testData.helper";

describe("Profile page", () => {
  before(() => {
    haveUserLogged(userMock);
  });

  it("image", () => {
    mount(
      <BrowserRouter>
        <SnackbarProvider>
          <AuthProvider>
            <ProfilePage />
          </AuthProvider>
        </SnackbarProvider>
      </BrowserRouter>,
      {
        stylesheets: ["/__root/src/index.css"],
      }
    );

    cy.get("#cypress-root").vrtTrack("Profile page");
  });
});
