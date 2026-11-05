import { User } from "../types";
import { TEST_USER } from "../_test/test.data.helper";
import {
  filterUsers,
  fullName,
  initials,
  recentGuests,
} from "./userList.helper";

const NOW = new Date("2026-11-05T12:00:00Z");
const make = (overrides: Partial<User>): User => ({
  ...TEST_USER,
  ...overrides,
});
const ANNA = make({
  id: "a",
  firstName: "Anna",
  lastName: "Ivanova",
  email: "anna@example.com",
  role: "editor",
});
const MARK = make({
  id: "m",
  firstName: "Mark",
  lastName: "Chen",
  email: "m.chen@corp.io",
  role: "guest",
  createdAt: "2026-11-04T12:00:00Z",
});

describe("user list helpers", () => {
  it("names a user and takes initials from both names", () => {
    expect(fullName(ANNA)).toBe("Anna Ivanova");
    expect(initials(ANNA)).toBe("AI");
  });

  it("finds users by name or email, ignoring case", () => {
    expect(filterUsers([ANNA, MARK], "IVAN", [])).toEqual([ANNA]);
    expect(filterUsers([ANNA, MARK], "corp", [])).toEqual([MARK]);
    expect(filterUsers([ANNA, MARK], "  ", [])).toEqual([ANNA, MARK]);
  });

  it("narrows by role label, together with the search", () => {
    expect(filterUsers([ANNA, MARK], "", ["Guest"])).toEqual([MARK]);
    expect(filterUsers([ANNA, MARK], "anna", ["Guest"])).toEqual([]);
  });

  it("counts guests who joined within the last 7 days", () => {
    const old = make({ ...MARK, id: "o", createdAt: "2026-10-01T00:00:00Z" });
    const unknown = make({ ...MARK, id: "u", createdAt: undefined });
    const newEditor = make({ ...ANNA, createdAt: "2026-11-05T00:00:00Z" });

    expect(recentGuests([MARK, old, unknown, newEditor], NOW)).toEqual([MARK]);
  });
});
