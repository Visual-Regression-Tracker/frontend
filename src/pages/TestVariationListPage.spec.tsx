import React from "react";
import { mountVrtComponent } from "../_test/test.moun.helper";
import {
  TEST_PROJECT,
  TEST_USER,
  TEST_VARIATION_ONE,
  TEST_VARIATION_TWO,
} from "../_test/test.data.helper";
import TestVariationListPage from "./TestVariationListPage";
import baselineImageMock from "../_test/images/baseline.png";
import imageMock from "../_test/images/screenshot.png";
import {
  projectStub,
  staticServiceStub,
  testVariationServiceStub,
} from "../_test/stub.helper";
import { haveUserLogged } from "../_test/precondition.helper";

describe("TestVariationListPage", () => {
  before(() => {
    haveUserLogged(TEST_USER);
    projectStub.getAll([TEST_PROJECT]);
    staticServiceStub
      .getImage()
      .withArgs(TEST_VARIATION_ONE.baselineName)
      .returns(baselineImageMock)
      .withArgs(TEST_VARIATION_TWO.baselineName)
      .returns(imageMock);
    testVariationServiceStub
      .getList()
      .resolves([TEST_VARIATION_ONE, TEST_VARIATION_TWO]);
  });

  it("image", () => {
    mountVrtComponent({
      component: <TestVariationListPage />,
      memoryRouterProps: {
        initialEntries: [`/${TEST_PROJECT.id}`],
      },
      path: "/:projectId",
    });

    cy.vrtTrack("TestVariationList page");
  });
});
