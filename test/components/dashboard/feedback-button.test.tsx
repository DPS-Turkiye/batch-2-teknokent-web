import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FeedbackButton } from "@/components/dashboard/feedback-button";
import { PlatformFeedbackKind } from "@/interfaces/platform-feedback";
import { submitPlatformFeedback } from "@/lib/client/platform-feedback";
import { platformFeedback } from "@test/fixtures/platform-feedback";
import { InLocale } from "@test/test-utils";

vi.mock("@/lib/client/platform-feedback", () => ({
  submitPlatformFeedback: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(submitPlatformFeedback).mockResolvedValue(platformFeedback());
});

describe("FeedbackButton", () => {
  it("opens an accessible tray, preserves a closed draft and restores keyboard focus", async () => {
    const user = userEvent.setup();
    render(<FeedbackButton />);
    const trigger = screen.getByRole("button", { name: "Geri bildirim" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Görüşünü paylaş" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      within(dialog).getByRole("button", { name: "Gönder" }),
    ).toBeDisabled();
    await user.type(screen.getByLabelText("Başlık"), "Yeni bir fikir");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    expect(screen.getByLabelText("Başlık")).toHaveValue("Yeni bir fikir");
    fireEvent.click(screen.getByRole("dialog").parentElement!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("changes category, submits a suggestion and shows a translated success state", async () => {
    const user = userEvent.setup();
    render(<FeedbackButton />);
    await user.click(screen.getByRole("button", { name: "Geri bildirim" }));
    await user.click(screen.getByRole("button", { name: "Öneri" }));
    expect(screen.getByRole("button", { name: "Öneri" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByPlaceholderText(
        "Fikrini ve sana nasıl yardımcı olacağını anlat…",
      ),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText("Başlık"), "Takvim");
    await user.type(
      screen.getByLabelText("Mesajın"),
      "Takvim kısayolu ekleyebilir misiniz?",
    );
    await user.click(screen.getByRole("button", { name: "Gönder" }));
    expect(submitPlatformFeedback).toHaveBeenCalledWith({
      kind: PlatformFeedbackKind.Suggestion,
      subject: "Takvim",
      message: "Takvim kısayolu ekleyebilir misiniz?",
      language: "tr",
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Paylaştığın için teşekkürler!",
    );
    await user.click(screen.getByRole("button", { name: "Tamam" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("updates every label and error when language changes without losing the draft", async () => {
    vi.mocked(submitPlatformFeedback).mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    const { rerender } = render(
      <InLocale locale="tr">
        <FeedbackButton />
      </InLocale>,
    );
    await user.click(screen.getByRole("button", { name: "Geri bildirim" }));
    await user.type(screen.getByLabelText("Başlık"), "Calendar");
    await user.type(screen.getByLabelText("Mesajın"), "Please add a shortcut.");
    await user.click(screen.getByRole("button", { name: "Gönder" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Mesajın gönderilemedi",
    );

    rerender(
      <InLocale locale="en">
        <FeedbackButton />
      </InLocale>,
    );

    expect(
      screen.getByRole("dialog", { name: "Share your thoughts" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Suggestion" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Subject")).toHaveValue("Calendar");
    expect(screen.getByLabelText("Your message")).toHaveValue(
      "Please add a shortcut.",
    );
    expect(
      screen.getByText(
        "Your message, name and email address are shared with the admins.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your message could not be sent.",
    );
    expect(screen.getByRole("button", { name: "Send feedback" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Close feedback panel" }),
    ).toBeInTheDocument();
  });
});
