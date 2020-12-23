/* global cy */
import React from "react";
import { staticService, testVariationService } from "../services";
import { mountVrtComponent } from "../_test/test.moun.helper";
import { projectMock, testRunMock, userMock } from "../_test/test.data.helper";
import TestVariationListPage from "./TestVariationListPage";
import baselineImageMock from "../_test/images/baseline.png";
import imageMock from "../_test/images/screenshot.png";
import { projectStub } from "../_test/stub.helper";
import { haveUserLogged } from "../_test/precondition.helper";

describe("TestVariationListPage", () => {
  before(() => {
    haveUserLogged(userMock);
    projectStub.getAll([projectMock]);
  });
  it("image", () => {
    cy.stub(staticService, "getImage")
      .withArgs("baseline1.png")
      .returns(baselineImageMock)
      .withArgs("baseline2.png")
      .returns(imageMock);

    cy.stub(testVariationService, "getList").resolves([
      {
        id: "some test variation id",
        name: "test run name",
        baselineName: "baseline1.png",
        os: "OS",
        browser: "browser",
        viewport: "viewport",
        device: "device",
        ignoreAreas: "[]",
        comment: "some comment",
        branchName: "branch name",
        baselines: [
          {
            id: "some baseline id1",
            baselineName: "baseline1.png",
            testRunId: "testRunId1",
            testVariationId: "some test variation id",
            createdAt: "2020-09-14T06:57:25.845Z",
            updatedAt: "2020-09-14T06:57:25.845Z",
            testRun: testRunMock,
          },
          {
            id: "some baseline id2",
            baselineName: "baseline2.png",
            testRunId: "testRunId2",
            testVariationId: "some test variation id",
            createdAt: "2020-09-12T06:57:25.845Z",
            updatedAt: "2020-09-12T06:57:25.845Z",
            testRun: testRunMock,
          },
        ],
      },
      {
        id: "some test variation id2",
        name: "test run name2",
        baselineName: "baseline2.png",
        os: "OS",
        browser: "browser",
        viewport: "viewport",
        device: "device",
        ignoreAreas: "[]",
        comment: "some comment",
        branchName: "branch name",
        baselines: [
          {
            id: "some baseline id1",
            baselineName: "baseline1.png",
            testRunId: "testRunId1",
            testVariationId: "some test variation id",
            createdAt: "2020-09-14T06:57:25.845Z",
            updatedAt: "2020-09-14T06:57:25.845Z",
            testRun: testRunMock,
          },
          {
            id: "some baseline id2",
            baselineName: "baseline2.png",
            testRunId: "testRunId2",
            testVariationId: "some test variation id",
            createdAt: "2020-09-12T06:57:25.845Z",
            updatedAt: "2020-09-12T06:57:25.845Z",
            testRun: testRunMock,
          },
        ],
      },
    ]);
    mountVrtComponent({
      component: <TestVariationListPage />,
      memoryRouterProps: {
        initialEntries: [`/${projectMock.id}`],
      },
      path: "/:projectId",
    });

    cy.vrtTrack("TestVariationList page");
  });
});
