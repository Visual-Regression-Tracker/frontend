/* global cy */
import React from "react";
import { mount } from "cypress-react-unit-test";
import ProfilePage from "./ProfilePage";
import { AuthProvider, AuthStateContext } from "../contexts";
import { BrowserRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";

describe("Login page", () => {
  it("image", () => {
    mount(
      <BrowserRouter>
        <SnackbarProvider>
          <AuthProvider>
            <AuthStateContext.Provider
              value={{
                loggedIn: true,
                user: {
                  id: "1",
                  token: 123,
                  apiKey: "SOME KEY SECRET",
                  email: "some@email.com",
                  firstName: "First name",
                  lastName: "Last name",
                },
              }}
            >
              <ProfilePage />
            </AuthStateContext.Provider>
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
