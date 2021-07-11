/* global cy */
import React from "react";
import ProjectPage from "./ProjectPage";
import { mountVrtComponent } from "../_test/test.moun.helper";
import baselineImageMock from "../_test/images/baseline.png";
import imageMock from "../_test/images/screenshot.png";
import diffMock from "../_test/images/diff.png";
import {
  projectStub,
  buildsServiceStub,
  testRunServiceStub,
  staticServiceStub,
} from "../_test/stub.helper";
import { haveUserLogged } from "../_test/precondition.helper";
import {
  TEST_BUILD_FAILED,
  TEST_BUILD_PASSED,
  TEST_BUILD_UNRESOLVED,
  TEST_PROJECT,
  TEST_RUN_APPROVED,
  TEST_RUN_NEW,
  TEST_RUN_OK,
  TEST_UNRESOLVED,
  TEST_USER,
} from "../_test/test.data.helper";

describe("Project page", () => {
  before(() => {
    haveUserLogged(TEST_USER);
    projectStub.getAll([TEST_PROJECT]);
  });
  it("image", () => {
    staticServiceStub
      .getImage()
      .withArgs("baseline.png")
      .returns(baselineImageMock)
      .withArgs("image.png")
      .returns(imageMock)
      .withArgs("diff.png")
      .returns(diffMock);

    buildsServiceStub.getList([
      TEST_BUILD_FAILED,
      TEST_BUILD_PASSED,
      TEST_BUILD_UNRESOLVED,
    ]);
    buildsServiceStub.getDetails(TEST_BUILD_FAILED);
    testRunServiceStub.getList([
      TEST_UNRESOLVED,
      TEST_RUN_APPROVED,
      TEST_RUN_NEW,
      TEST_RUN_OK,
      {
        ...TEST_RUN_OK,
        id: "some test run id5",
      },
      {
        ...TEST_RUN_OK,
        id: "some test run id6",
      },
      {
        ...TEST_RUN_OK,
        id: "some test run id7",
      },
    ]);

    mountVrtComponent({
      component: <ProjectPage />,
      memoryRouterProps: {
        initialEntries: [`/${TEST_PROJECT.id}`],
      },
      path: "/:projectId",
    });

    cy.vrtTrack("Project page");

    cy.contains(TEST_UNRESOLVED.name).click();

    cy.get("[data-testid='image-details']").should(($imageDetails) => {
      expect($imageDetails).to.have.length(2);
      expect($imageDetails.eq(0)).to.have.text("Real size: 1280 x 720");
      expect($imageDetails.eq(1)).to.have.text("Real size: 1280 x 720");
    });
    cy.get(".MuiDialog-root").vrtTrack("TestDetailsModal");
  });
});
