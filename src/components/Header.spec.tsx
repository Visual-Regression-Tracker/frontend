/// <reference types="cypress" />
/// <reference types="@visual-regression-tracker/agent-cypress/dist" />

import React from "react";
import { mount } from "cypress-react-unit-test";
import Header from "./Header";
import { AuthProvider } from "../contexts";
import { BrowserRouter } from "react-router-dom";

describe("Component spec in typescript", () => {
  it("works", () => {
    mount(
      <BrowserRouter>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </BrowserRouter>
    );
  });
});
