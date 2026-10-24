import { formatDateTime } from "./format.helper";

describe("formatDateTime", () => {
  it.each([
    "2020-09-14T06:57:25.845Z",
    "2021-01-01T00:00:00.000Z",
    "2024-02-29T23:59:59Z",
    "2020-09-14",
  ])("shows %s in the date and time format of the user's locale", (date) => {
    expect(formatDateTime(date)).toBe(new Date(date).toLocaleString());
  });

  it("shows both the date and the time", () => {
    const formatted = formatDateTime("2020-09-14T06:57:25.845Z");

    expect(formatted).toMatch(/2020/);
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
  });

  it("shows Invalid Date for something that is not a date", () => {
    expect(formatDateTime("not a date")).toBe("Invalid Date");
  });
});
