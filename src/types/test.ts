export interface Test {
    id: number,
    name: string,
    buildId: number,
    baselineUrl: string,
    imageUrl: string,
    diffUrl: string,
    os: string,
    browser: string,
    viewport: string,
    device: string,
    status: string,
}