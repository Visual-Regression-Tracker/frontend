import React, { useState } from "react";
import { screen, waitFor } from "@testing-library/react";
import { ValidatorForm } from "react-material-ui-form-validator";
import { renderWithProviders } from "../_test/render";
import PasswordField from "./PasswordField";

const Harness = ({ label }: { label?: string }) => {
  const [password, setPassword] = useState("");
  return (
    <ValidatorForm onSubmit={() => undefined} instantValidate>
      <PasswordField
        password={password}
        setPassword={setPassword}
        label={label}
      />
      <output data-testid="current">{password}</output>
    </ValidatorForm>
  );
};

describe("PasswordField", () => {
  it("hides the typed password by default", () => {
    renderWithProviders(<Harness />);

    expect(screen.getByTestId("password")).toHaveAttribute("type", "password");
  });

  it("reports what is typed to the parent", async () => {
    const { user } = renderWithProviders(<Harness />);

    await user.type(screen.getByTestId("password"), "secret");

    expect(screen.getByTestId("current")).toHaveTextContent("secret");
    expect(screen.getByTestId("password")).toHaveValue("secret");
  });

  it("shows and hides the password with the visibility toggle", async () => {
    const { user } = renderWithProviders(<Harness />);
    await user.type(screen.getByTestId("password"), "secret");

    await user.click(
      screen.getByRole("button", { name: "toggle password visibility" }),
    );
    expect(screen.getByTestId("password")).toHaveAttribute("type", "text");
    expect(screen.getByTestId("password")).toHaveValue("secret");

    await user.click(
      screen.getByRole("button", { name: "toggle password visibility" }),
    );
    expect(screen.getByTestId("password")).toHaveAttribute("type", "password");
  });

  it("labels the field Password unless told otherwise", () => {
    const { unmount } = renderWithProviders(<Harness />);
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    unmount();

    renderWithProviders(<Harness label="New password" />);
    expect(screen.getByLabelText(/^New password/)).toBeInTheDocument();
  });

  it("asks for at least two characters", async () => {
    const { user } = renderWithProviders(<Harness />);

    await user.type(screen.getByTestId("password"), "a");

    expect(
      await screen.findByText("Enter at least two characters."),
    ).toBeVisible();

    await user.type(screen.getByTestId("password"), "b");

    // the validator checks asynchronously, so the message goes a tick later
    await waitFor(() =>
      expect(
        screen.queryByText("Enter at least two characters."),
      ).not.toBeInTheDocument(),
    );
  });
});
