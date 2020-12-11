/* global cy */
import React from "react";
import { mount } from "cypress-react-unit-test";
import Header from "./Header";
import { AuthProvider } from "../contexts";
import { BrowserRouter } from "react-router-dom";
import { haveUserLogged } from "../_test/precondition.helper";
import { userMock } from "../_test/test.data.helper";

describe("Header", () => {
  describe("image", () => {
    it("Guest", () => {
      localStorage.clear();
      mount(
        <BrowserRouter>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </BrowserRouter>
      );

      cy.get("#cypress-root").vrtTrack("Header. Guest");
    });

    it("Logged", () => {
      haveUserLogged(userMock);
      mount(
        <BrowserRouter>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </BrowserRouter>
      );

      cy.get("#cypress-root").vrtTrack("Header. Logged");
    });
  });
});
