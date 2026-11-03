import type { Request } from "@playwright/test";

export const postData = <T>(request: Request): T => request.postDataJSON() as T;
