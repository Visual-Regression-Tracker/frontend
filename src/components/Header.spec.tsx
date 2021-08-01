/* global cy */
import React from "react";
import { mount } from "@cypress/react";
import Header from "./Header";
import { UserProvider } from "../contexts";
import { BrowserRouter } from "react-router-dom";
import { haveUserLogged } from "../_test/precondition.helper";
import { TEST_USER } from "../_test/test.data.helper";

describe("Header", () => {
  describe("image", () => {
    it("Guest", () => {
      localStorage.clear();
      mount(
        <BrowserRouter>
          <UserProvider>
            <Header />
          </UserProvider>
        </BrowserRouter>
      );

      cy.get("#__cy_root").vrtTrack("Header. Guest");
    });

    it("Logged", () => {
      haveUserLogged(TEST_USER);
      mount(
        <BrowserRouter>
          <UserProvider>
            <Header />
          </UserProvider>
        </BrowserRouter>
      );

      cy.get("#__cy_root").vrtTrack("Header. Logged");
    });
  });
});
