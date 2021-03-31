/* global cy */
import React from "react";
import ProjectPage from "./ProjectPage";
import { staticService } from "../services";
import { BuildStatus } from "../types/buildStatus";
import { TestStatus } from "../types/testStatus";
import { mountVrtComponent } from "../_test/test.moun.helper";
import baselineImageMock from "../_test/images/baseline.png";
import imageMock from "../_test/images/screenshot.png";
import diffMock from "../_test/images/diff.png";
import {
  projectStub,
  buildsServiceStub,
  testRunServiceStub,
} from "../_test/stub.helper";
import { haveUserLogged } from "../_test/precondition.helper";
import { PROJECT_ONE, userMock } from "../_test/test.data.helper";

describe("Project page", () => {
  before(() => {
    haveUserLogged(userMock);
    projectStub.getAll([PROJECT_ONE]);
  });
  it("image", () => {
    cy.stub(staticService, "getImage")
      .withArgs("baseline.png")
      .returns(baselineImageMock)
      .withArgs("image.png")
      .returns(imageMock)
      .withArgs("diff.png")
      .returns(diffMock);

    buildsServiceStub.getList([
      {
        id: "someId",
        number: 1,
        ciBuildId: "some build id",
        projectName: "Project name",
        branchName: "Branch name",
        status: BuildStatus.failed,
        createdAt: "2020-09-14T06:57:25.845Z",
        createdBy: "2020-09-14T06:57:25.845Z",
        testRuns: [],
        unresolvedCount: 0,
        passedCount: 2,
        failedCount: 1,
        isRunning: false,
        merge: false,
      },
      {
        id: "someId2",
        number: 2,
        ciBuildId: "",
        projectName: "Project name",
        branchName: "Branch name",
        status: BuildStatus.passed,
        createdAt: "2020-09-14T06:57:25.845Z",
        createdBy: "2020-09-14T06:57:25.845Z",
        testRuns: [],
        unresolvedCount: 0,
        passedCount: 2,
        failedCount: 0,
        isRunning: false,
        merge: false,
      },
      {
        id: "someId3",
        number: 3,
        ciBuildId: "",
        projectName: "Project name",
        branchName: "Branch name",
        status: BuildStatus.unresolved,
        createdAt: "2020-09-14T06:57:25.845Z",
        createdBy: "2020-09-14T06:57:25.845Z",
        testRuns: [],
        unresolvedCount: 2,
        passedCount: 0,
        failedCount: 0,
        isRunning: false,
        merge: true,
      },
    ]);
    buildsServiceStub.getDetails({
      id: "someId",
      number: 1,
      ciBuildId: "some build id",
      projectName: "Project name",
      branchName: "Branch name",
      status: BuildStatus.failed,
      createdAt: "2020-09-14T06:57:25.845Z",
      createdBy: "2020-09-14T06:57:25.845Z",
      testRuns: [],
      unresolvedCount: 0,
      passedCount: 2,
      failedCount: 1,
      isRunning: false,
      merge: false,
    });
    testRunServiceStub.getList([
      {
        id: "some test run id",
        buildId: "some build id",
        imageName: "image.png",
        diffName: "diff.png",
        baselineName: "baseline.png",
        diffPercent: 1.24,
        diffTollerancePercent: 3.21,
        status: TestStatus.unresolved,
        testVariationId: "some test variation id",
        name: "test run name",
        os: "OS",
        browser: "browser",
        viewport: "viewport",
        device: "device",
        ignoreAreas:
          '[{"id":"1606901916571","x":232,"y":123,"width":166,"height":138}]',
        tempIgnoreAreas: '[{"x":100,"y":300,"width":600,"height":700}]',
        comment: "some comment",
        branchName: "branch name",
        baselineBranchName: "baselineBranchName",
        merge: false,
      },
      {
        id: "some test run id2",
        buildId: "some build id",
        imageName: "imageName",
        diffName: "diffName",
        diffPercent: 1.24,
        diffTollerancePercent: 3.21,
        status: TestStatus.approved,
        testVariationId: "some test variation id",
        name: "test run name2",
        baselineName: "baselineName",
        os: "OS",
        browser: "browser",
        viewport: "viewport",
        device: "device",
        ignoreAreas: "[]",
        tempIgnoreAreas: "[]",
        comment: "some comment",
        branchName: "branch name",
        baselineBranchName: "baselineBranchName",
        merge: false,
      },
      {
        id: "some test run id3",
        buildId: "some build id",
        imageName: "imageName",
        diffName: "diffName",
        diffPercent: 1.24,
        diffTollerancePercent: 3.21,
        status: TestStatus.new,
        testVariationId: "some test variation id",
        name: "test run name3",
        baselineName: "baselineName",
        os: "",
        browser: "",
        viewport: "",
        device: "",
        ignoreAreas: "[]",
        tempIgnoreAreas: "[]",
        comment: "some comment",
        branchName: "branch name",
        baselineBranchName: "baselineBranchName",
        merge: false,
      },
      {
        id: "some test run id4",
        buildId: "some build id",
        imageName: "imageName",
        diffName: "diffName",
        diffPercent: 1.24,
        diffTollerancePercent: 3.21,
        status: TestStatus.ok,
        testVariationId: "some test variation id",
        name: "test run name4",
        baselineName: "baselineName",
        os: "",
        browser: "",
        viewport: "",
        device: "",
        ignoreAreas: "[]",
        tempIgnoreAreas: "[]",
        comment: "some comment",
        branchName: "branch name",
        baselineBranchName: "baselineBranchName",
        merge: false,
      },
      {
        id: "some test run id7",
        buildId: "some build id",
        imageName: "imageName",
        diffName: "diffName",
        diffPercent: 1.24,
        diffTollerancePercent: 3.21,
        status: TestStatus.ok,
        testVariationId: "some test variation id",
        name: "test run name4",
        baselineName: "baselineName",
        os: "",
        browser: "",
        viewport: "",
        device: "",
        ignoreAreas: "[]",
        tempIgnoreAreas: "[]",
        comment: "some comment",
        branchName: "branch name",
        baselineBranchName: "baselineBranchName",
        merge: false,
      },
      {
        id: "some test run id6",
        buildId: "some build id",
        imageName: "imageName",
        diffName: "diffName",
        diffPercent: 1.24,
        diffTollerancePercent: 3.21,
        status: TestStatus.ok,
        testVariationId: "some test variation id",
        name: "test run name4",
        baselineName: "baselineName",
        os: "",
        browser: "",
        viewport: "",
        device: "",
        ignoreAreas: "[]",
        tempIgnoreAreas: "[]",
        comment: "some comment",
        branchName: "branch name",
        baselineBranchName: "baselineBranchName",
        merge: false,
      },
      {
        id: "some test run id5",
        buildId: "some build id",
        imageName: "imageName",
        diffName: "diffName",
        diffPercent: 1.24,
        diffTollerancePercent: 3.21,
        status: TestStatus.ok,
        testVariationId: "some test variation id",
        name: "test run name4",
        baselineName: "baselineName",
        os: "",
        browser: "",
        viewport: "",
        device: "",
        ignoreAreas: "[]",
        tempIgnoreAreas: "[]",
        comment: "some comment",
        branchName: "branch name",
        baselineBranchName: "baselineBranchName",
        merge: false,
      },
    ]);

    mountVrtComponent({
      component: <ProjectPage />,
      memoryRouterProps: {
        initialEntries: ["/someProjectId"],
      },
      path: "/:projectId",
    });

    cy.vrtTrack("Project page");

    cy.contains("test run name").click();

    cy.get("[data-testid='image-details']").should(($imageDetails) => {
      expect($imageDetails).to.have.length(2);
      expect($imageDetails.eq(0)).to.have.text("Real size: 1280 x 720");
      expect($imageDetails.eq(1)).to.have.text("Real size: 1280 x 720");
    });
    cy.get(".MuiDialog-root").vrtTrack("TestDetailsModal");
  });
});
