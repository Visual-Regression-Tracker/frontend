import { Test } from "./test";

export interface Build {
    id: string,
    projectName: string,
    branchName: string,
    status: string,
    createdAt: Date,
    createdBy: string,
    tests: Test[]
}