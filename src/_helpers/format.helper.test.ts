import {
  failureVariant,
  formatDateTime,
  partialFailureText,
  pluralize,
} from "./format.helper";

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

describe("pluralize", () => {
  it.each([
    [0, "runs"],
    [1, "run"],
    [2, "runs"],
  ])("uses the right form for %i", (count, expected) => {
    expect(pluralize(count, "run")).toBe(expected);
  });

  it("takes an irregular plural", () => {
    expect(pluralize(2, "is", "are")).toBe("are");
    expect(pluralize(1, "is", "are")).toBe("is");
  });
});

describe("partialFailureText", () => {
  it("says how many succeeded and why the first one failed", () => {
    expect(
      partialFailureText(
        "Approved",
        { succeeded: ["a"], failed: [{ message: "X" }] },
        "2 test runs",
      ),
    ).toBe("Approved 1 of 2 test runs. 1 failed: X");
  });

  it("quotes a server failure before a refusal", () => {
    expect(
      partialFailureText(
        "Approved",
        {
          succeeded: [],
          failed: [{ message: "Refused" }, { message: "Internal error" }],
        },
        "2 test runs",
      ),
    ).toBe("Approved 0 of 2 test runs. 2 failed: Internal error");
  });
});

describe("failureVariant", () => {
  it("warns about runs the backend refused", () => {
    expect(
      failureVariant([{ message: "Test run a is already approved" }]),
    ).toBe("warning");
  });

  it("reports an error when the server broke off on any run", () => {
    expect(
      failureVariant([
        { message: "Test run a is already approved" },
        { message: "Internal error" },
      ]),
    ).toBe("error");
  });
});
