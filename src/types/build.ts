export interface Build {
    id: number,
    projectName: string,
    branchName: string,
    status: string,
    createdAt: Date,
    createdBy: string,
}