export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  token: number;
  apiKey: string;
  role: Role;
}

export enum Role {
  admin = "Admin",
  editor = "Editor",
  guest = "Guest",
}
