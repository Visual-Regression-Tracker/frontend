import { User } from "../types";

const haveUserLogged = (user: User) =>
  localStorage.setItem("user", JSON.stringify(user));

export { haveUserLogged };
