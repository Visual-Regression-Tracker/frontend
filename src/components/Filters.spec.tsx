/* global cy */
import React from "react";
import { mount } from "@cypress/react";
import Filters from "./Filters";
import { TestStatus } from "../types/testStatus";

describe("Filters", () => {
  it("image", () => {
    mount(
      <Filters
        items={[
          {
            id: "id",
            buildId: "buildId",
            imageName: "imageName",
            diffName: "diffName",
            diffPercent: 12,
            diffTollerancePercent: 0,
            status: TestStatus.ok,
            testVariationId: "testVariationId",
            name: "name",
            baselineName: "baselineName",
            os: "Windows",
            browser: "Chrome",
            viewport: "100x200",
            device: "Laptop",
            ignoreAreas: "[]",
            comment: "comment",
            branchName: "master",
            baselineBranchName: "baselineBranchName",
            merge: false,
            tempIgnoreAreas: "[]",
          },
        ]}
        queryState={["Some query", cy.stub()]}
        osState={["Windows", cy.stub()]}
        deviceState={["Laptop", cy.stub()]}
        browserState={["Chrome", cy.stub()]}
        viewportState={["100x200", cy.stub()]}
        testStatusState={[TestStatus.ok, cy.stub()]}
      />
    );

    cy.get("#__cy_root").vrtTrack("Filters");
  });
});
