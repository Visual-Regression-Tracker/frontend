/* global cy */
import {
  buildsService,
  projectsService,
  testRunService,
  staticService,
  testVariationService,
} from "../services";
import { Build, Project, TestRun } from "../types";

const projectStub = {
  getAll: (projects: Array<Project>) =>
    cy.stub(projectsService, "getAll").resolves(projects),
};

const buildsServiceStub = {
  getDetails: (build: Build) =>
    cy.stub(buildsService, "getDetails").resolves(build),
  getList: (builds: Array<Build>) =>
    cy.stub(buildsService, "getList").resolves({
      data: builds,
      total: 100,
      skip: 0,
      take: 10,
    }),
};

const testRunServiceStub = {
  getList: (testRuns: Array<TestRun>) =>
    cy.stub(testRunService, "getList").resolves(testRuns),
};

const staticServiceStub = {
  getImage: () => cy.stub(staticService, "getImage"),
};

const testVariationServiceStub = {
  getDetails: () => cy.stub(testVariationService, "getDetails"),
  getList: () => cy.stub(testVariationService, "getList"),
};

export {
  projectStub,
  buildsServiceStub,
  testRunServiceStub,
  staticServiceStub,
  testVariationServiceStub,
};
