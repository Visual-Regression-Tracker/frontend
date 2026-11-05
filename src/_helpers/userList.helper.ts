import { Role, User } from "../types";

export const ROLE_KEYS = Object.keys(Role) as (keyof typeof Role)[];

const WEEK = 7 * 24 * 60 * 60 * 1000;

export const fullName = ({ firstName, lastName }: User): string =>
  `${firstName} ${lastName}`.trim();

export const initials = ({ firstName, lastName }: User): string =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

export const filterUsers = (
  users: User[],
  search: string,
  roles: string[],
): User[] => {
  const query = search.trim().toLowerCase();
  return users.filter(
    (user) =>
      (roles.length === 0 || roles.includes(Role[user.role])) &&
      (query === "" ||
        fullName(user).toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)),
  );
};

export const recentGuests = (users: User[], now = new Date()): User[] =>
  users.filter(
    (user) =>
      user.role === "guest" &&
      user.createdAt !== undefined &&
      now.getTime() - new Date(user.createdAt).getTime() < WEEK,
  );
