import { Build } from "./build";

export interface Project {
  id: string;
  name: string;
  builds: Build[];
  updatedAt: string;
  createdAt: string;
}
