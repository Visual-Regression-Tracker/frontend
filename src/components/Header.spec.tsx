import React from "react";
import Header from "./Header";
import { haveUserLogged } from "../_test/precondition.helper";
import { TEST_PROJECT, TEST_USER } from "../_test/test.data.helper";
import { mountVrtComponent } from "../_test/test.moun.helper";
import { projectStub } from "../_test/stub.helper";

describe("Header", () => {
  describe("image", () => {
    it("Guest", () => {
      localStorage.clear();
      mountVrtComponent({ component: <Header /> });

      cy.get("[data-cy-root]").vrtTrack("Header. Guest");
    });

    it("Logged", () => {
      haveUserLogged(TEST_USER);
      projectStub.getAll([TEST_PROJECT]);

      mountVrtComponent({ component: <Header /> });

      cy.get("[data-cy-root]").vrtTrack("Header. Logged");
    });
  });
});
