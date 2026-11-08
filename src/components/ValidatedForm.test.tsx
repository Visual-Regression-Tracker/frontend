import { useState } from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { minLength, required } from "../_helpers/validation";
import { ValidatedForm, ValidatedTextField } from "./ValidatedForm";

const NAME_RULES = [
  required("Name is required"),
  minLength(2, "Enter at least two characters."),
];
const CITY_RULES = [required("City is required")];

const Harness = ({
  onSubmit,
  initialName = "",
  withCity = true,
}: {
  onSubmit: () => void;
  initialName?: string;
  withCity?: boolean;
}) => {
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState("");
  return (
    <ValidatedForm onSubmit={onSubmit}>
      <ValidatedTextField
        label="Name"
        helperText="Your full name"
        rules={NAME_RULES}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      {withCity && (
        <ValidatedTextField
          label="City"
          rules={CITY_RULES}
          value={city}
          onChange={(event) => setCity(event.target.value)}
        />
      )}
      <button type="submit">Save</button>
    </ValidatedForm>
  );
};

describe("ValidatedForm", () => {
  it("shows the helper text until a typed value breaks a rule", async () => {
    const { user } = renderWithProviders(<Harness onSubmit={vi.fn()} />);

    expect(screen.getByText("Your full name")).toBeVisible();
    await user.type(screen.getByLabelText("Name"), "A");

    expect(screen.getByText("Enter at least two characters.")).toBeVisible();
    expect(screen.queryByText("Your full name")).toBeNull();
    expect(screen.getByLabelText("Name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("clears the error once the value is valid", async () => {
    const { user } = renderWithProviders(<Harness onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText("Name"), "A");
    await user.type(screen.getByLabelText("Name"), "n");

    expect(screen.queryByText("Enter at least two characters.")).toBeNull();
    expect(screen.getByText("Your full name")).toBeVisible();
  });

  it("keeps checking a field typed back to its first value", async () => {
    const { user } = renderWithProviders(<Harness onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText("Name"), "A");
    await user.clear(screen.getByLabelText("Name"));

    expect(screen.getByText("Enter at least two characters.")).toBeVisible();
  });

  it("does not point out an empty required field while typing", async () => {
    const { user } = renderWithProviders(<Harness onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText("City"), "X");
    await user.clear(screen.getByLabelText("City"));

    expect(screen.queryByText("City is required")).toBeNull();
  });

  it("shows every field's error on submit and does not submit", async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<Harness onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Name is required")).toBeVisible();
    expect(screen.getByText("City is required")).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a required field's own error, not the browser's tooltip", async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(
      <ValidatedForm onSubmit={onSubmit}>
        <ValidatedTextField
          label="City"
          required
          rules={CITY_RULES}
          value=""
          onChange={() => undefined}
        />
        <button type="submit">Save</button>
      </ValidatedForm>,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("City is required")).toBeVisible();
  });

  it("submits when every field is valid", async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(
      <Harness onSubmit={onSubmit} initialName="Ann" />,
    );

    await user.type(screen.getByLabelText("City"), "Kyiv");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/is required/)).toBeNull();
  });

  it("does not check a field that is no longer shown", async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(
      <Harness onSubmit={onSubmit} initialName="Ann" withCity={false} />,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("clears a required error when the field is typed in", async () => {
    const { user } = renderWithProviders(
      <Harness onSubmit={vi.fn()} initialName="Ann" />,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.type(screen.getByLabelText("City"), "K");

    expect(screen.queryByText("City is required")).toBeNull();
  });
});
