/* global cy */
import React from "react";
import { mountVrtComponent } from "../_test/test.moun.helper";
import { PROJECT_ONE, TEST_VARIATION_TWO } from "../_test/test.data.helper";
import TestVariationListPage from "./TestVariationListPage";
import baselineImageMock from "../_test/images/baseline.png";
import imageMock from "../_test/images/screenshot.png";
import {
  projectStub,
  staticServiceStub,
  testVariationServiceStub,
} from "../_test/stub.helper";

describe("TestVariationListPage", () => {
  before(() => {
    projectStub.getAll([PROJECT_ONE]);
    staticServiceStub
      .getImage()
      .withArgs(TEST_VARIATION_TWO.baselineName)
      .returns(baselineImageMock)
      .withArgs(TEST_VARIATION_TWO.baselineName)
      .returns(imageMock);
    testVariationServiceStub
      .getList()
      .resolves([TEST_VARIATION_TWO, TEST_VARIATION_TWO]);
  });
  it("image", () => {
    mountVrtComponent({
      component: <TestVariationListPage />,
      memoryRouterProps: {
        initialEntries: [`/${PROJECT_ONE.id}`],
      },
      path: "/:projectId",
    });

    cy.vrtTrack("TestVariationList page");
  });
});
