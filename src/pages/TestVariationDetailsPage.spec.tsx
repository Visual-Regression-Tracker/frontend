/* global cy */
import React from "react";
import { mountVrtComponent } from "../_test/test.moun.helper";
import { TEST_VARIATION_ONE } from "../_test/test.data.helper";
import TestVariationDetailsPage from "./TestVariationDetailsPage";
import baselineImageMock from "../_test/images/baseline.png";
import imageMock from "../_test/images/screenshot.png";
import {
  staticServiceStub,
  testVariationServiceStub,
} from "../_test/stub.helper";

const testVariation = TEST_VARIATION_ONE;

describe("TestVariationDetailsPage", () => {
  before(() => {
    staticServiceStub
      .getImage()
      .withArgs(testVariation.baselines[0].baselineName)
      .returns(baselineImageMock)
      .withArgs(testVariation.baselines[1].baselineName)
      .returns(imageMock);
    testVariationServiceStub.getDetails().resolves(testVariation);
  });

  it("image", () => {
    mountVrtComponent({
      component: <TestVariationDetailsPage />,
      memoryRouterProps: {
        initialEntries: [`/${testVariation.id}`],
      },
      path: "/:testVariationId",
    });

    cy.vrtTrack("TestVariationDetails page");
  });
});
