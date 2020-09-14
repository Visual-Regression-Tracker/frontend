/* global cy */
import React from "react";
import { mount } from "cypress-react-unit-test";
import Header from "./Header";
import { AuthProvider, AuthStateContext } from "../contexts";
import { BrowserRouter } from "react-router-dom";

describe("Header", () => {
  it("image", () => {
    mount(
      <BrowserRouter>
        <AuthProvider>
          <AuthStateContext.Provider
            value={{
              loggedIn: false,
            }}
          >
            <Header />
          </AuthStateContext.Provider>
        </AuthProvider>
      </BrowserRouter>
    );

    cy.get("#cypress-root").vrtTrack("Header. Guest");

    mount(
      <BrowserRouter>
        <AuthProvider>
          <AuthStateContext.Provider
            value={{
              loggedIn: true,
              user: {
                id: "1",
                token: 123,
                apiKey: "apuKey",
                email: "some@email.com",
                firstName: "First name",
                lastName: "Last name",
              },
            }}
          >
            <Header />
          </AuthStateContext.Provider>
        </AuthProvider>
      </BrowserRouter>
    );

    cy.get("#cypress-root").vrtTrack("Header. Logged");
  });
});
