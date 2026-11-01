import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { CommentsPopper } from "./CommentsPopper";

const PLACEHOLDER = "Add any additional data here";

const renderPopper = ({
  text = "",
  onSave = vi.fn().mockResolvedValue(undefined),
}: {
  text?: string;
  onSave?: (comment: string) => Promise<void | string | number>;
} = {}) => ({
  onSave,
  ...renderWithProviders(<CommentsPopper text={text} onSave={onSave} />),
});

// paste, not type: typing through MUI's multiline field is slow
const write = async (
  user: ReturnType<typeof renderPopper>["user"],
  editor: HTMLElement,
  text: string,
) => {
  await user.click(editor);
  await user.paste(text);
};

const openButton = () => screen.getByRole("button", { name: "Comments" });

describe("CommentsPopper", () => {
  it("keeps the editor closed until Comments is clicked", () => {
    renderPopper({ text: "existing comment" });

    expect(screen.getByRole("button", { name: "Comments" })).toBeVisible();
    expect(screen.queryByPlaceholderText(PLACEHOLDER)).not.toBeInTheDocument();
  });

  it("opens with the current comment in the editor", async () => {
    const { user } = renderPopper({ text: "existing comment" });

    await user.click(openButton());

    expect(await screen.findByPlaceholderText(PLACEHOLDER)).toHaveValue(
      "existing comment",
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
  });

  it("opens with an empty editor when there is no comment", async () => {
    const { user } = renderPopper({ text: undefined });

    await user.click(openButton());

    expect(await screen.findByPlaceholderText(PLACEHOLDER)).toHaveValue("");
  });

  it("saves the text that was typed and closes", async () => {
    const { user, onSave } = renderPopper();

    await user.click(openButton());
    await write(
      user,
      await screen.findByPlaceholderText(PLACEHOLDER),
      "looks fine on mobile",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith("looks fine on mobile");
    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText(PLACEHOLDER),
      ).not.toBeInTheDocument(),
    );
  });

  it("saves an edited comment in place of the old text", async () => {
    const { user, onSave } = renderPopper({ text: "old" });

    await user.click(openButton());
    const editor = await screen.findByPlaceholderText(PLACEHOLDER);
    await user.clear(editor);
    await write(user, editor, "new");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith("new");
  });

  it("saves an emptied comment as an empty string", async () => {
    const { user, onSave } = renderPopper({ text: "to be removed" });

    await user.click(openButton());
    await user.clear(await screen.findByPlaceholderText(PLACEHOLDER));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith("");
  });

  it("stays open until the save has finished", async () => {
    let finishSaving: () => void = () => undefined;
    const onSave = vi.fn(
      () => new Promise<void>((resolve) => (finishSaving = resolve)),
    );
    const { user } = renderPopper({ onSave });

    await user.click(openButton());
    await write(user, await screen.findByPlaceholderText(PLACEHOLDER), "text");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeVisible();

    finishSaving();

    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText(PLACEHOLDER),
      ).not.toBeInTheDocument(),
    );
  });

  it("stays open with the draft when the save fails", async () => {
    const onSave = vi.fn().mockRejectedValue("Server error");
    const { user } = renderPopper({ onSave });

    await user.click(openButton());
    await write(user, await screen.findByPlaceholderText(PLACEHOLDER), "text");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    // let the rejection settle: an unhandled one fails the run
    await new Promise((resolve) => setTimeout(resolve));
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toHaveValue("text");
    expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
  });

  it.each([
    ["the editor", () => screen.getByPlaceholderText(PLACEHOLDER)],
    ["Save", () => screen.getByRole("button", { name: "Save" })],
    ["Comments", openButton],
  ])(
    "closes on Escape in %s, keeps the draft and keeps the key to itself",
    async (_, target) => {
      const onParentKeyDown = vi.fn();
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { user } = renderWithProviders(
        <div role="presentation" onKeyDown={onParentKeyDown}>
          <CommentsPopper text="" onSave={onSave} />
        </div>,
      );
      await user.click(openButton());
      await write(
        user,
        await screen.findByPlaceholderText(PLACEHOLDER),
        "draft",
      );

      target().focus();
      await user.keyboard("{Escape}");

      await waitFor(() =>
        expect(
          screen.queryByPlaceholderText(PLACEHOLDER),
        ).not.toBeInTheDocument(),
      );
      expect(onParentKeyDown).not.toHaveBeenCalled();
      expect(onSave).not.toHaveBeenCalled();
      await user.click(openButton());
      expect(await screen.findByPlaceholderText(PLACEHOLDER)).toHaveValue(
        "draft",
      );
    },
  );

  it("leaves Escape to the page while it is closed", async () => {
    const onParentKeyDown = vi.fn();
    const { user } = renderWithProviders(
      <div role="presentation" onKeyDown={onParentKeyDown}>
        <CommentsPopper text="" onSave={vi.fn()} />
      </div>,
    );

    openButton().focus();
    await user.keyboard("{Escape}");

    expect(onParentKeyDown).toHaveBeenCalledTimes(1);
  });

  it("closes without saving when Comments is clicked again", async () => {
    const { user, onSave } = renderPopper();

    await user.click(openButton());
    await write(user, await screen.findByPlaceholderText(PLACEHOLDER), "draft");
    await user.click(openButton());

    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText(PLACEHOLDER),
      ).not.toBeInTheDocument(),
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows the new comment when the text it is given changes", async () => {
    const { user, rerender, onSave } = renderPopper({ text: "first" });

    rerender(<CommentsPopper text="second" onSave={onSave} />);
    await user.click(openButton());

    expect(await screen.findByPlaceholderText(PLACEHOLDER)).toHaveValue(
      "second",
    );
  });

  it("keeps an unsaved draft when it is closed and opened again", async () => {
    const { user } = renderPopper({ text: "saved" });

    await user.click(openButton());
    await write(
      user,
      await screen.findByPlaceholderText(PLACEHOLDER),
      " + draft",
    );
    await user.click(openButton());
    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText(PLACEHOLDER),
      ).not.toBeInTheDocument(),
    );
    await user.click(openButton());

    expect(await screen.findByPlaceholderText(PLACEHOLDER)).toHaveValue(
      "saved + draft",
    );
  });
});
