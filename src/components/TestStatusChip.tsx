import React from "react";
import { Chip } from "@material-ui/core";
import { TestStatus } from "../types/testStatus";

const TestStatusChip: React.FunctionComponent<{ status: TestStatus }> = ({
  status,
}) => {
  let color: "inherit" | "primary" | "secondary" | "default" | undefined;
  switch (status) {
    case TestStatus.new:
      color = "primary";
      break;
    case TestStatus.unresolved:
      color = "secondary";
      break;
    case TestStatus.failed:
      color = "secondary";
      break;
    default:
      color = undefined;
  }
  return <Chip variant="outlined" color={color} label={status} />;
};

export default TestStatusChip;
