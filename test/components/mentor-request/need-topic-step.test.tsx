import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { needChoices } from "@/lib/mentor-request-need";

import { NeedTopicStep } from "@/components/mentor-request/need-topic-step";
import { InLocale } from "@test/test-utils";

const STARTUP_CHOICES = needChoices(false);

describe("NeedTopicStep", () => {
  it("reads in English", () => {
    render(
      <InLocale locale="en">
        <NeedTopicStep
          topics={STARTUP_CHOICES.topics}
          topicId="other"
          otherSummary=""
          onSelectTopic={vi.fn()}
          onOtherSummaryChange={vi.fn()}
        />
      </InLocale>,
    );

    expect(
      screen.getByRole("heading", {
        name: "What's challenging you most right now?",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Topic")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Something else/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByPlaceholderText("Describe your need in your own words…"),
    ).toBeInTheDocument();
  });

  it("renders the Figma Konu step copy and topics", () => {
    render(
      <NeedTopicStep
        topics={STARTUP_CHOICES.topics}
        topicId="product"
        otherSummary=""
        onSelectTopic={vi.fn()}
        onOtherSummaryChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Şu an seni en çok zorlayan şey ne?",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Konu")).toBeInTheDocument();
    expect(screen.getByText("Durum")).toBeInTheDocument();
    expect(screen.getByText("Hedef")).toBeInTheDocument();
    expect(screen.getByText("Özet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ürün/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /Müşteri/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(
      screen.getByRole("button", { name: /Başka bir konu/ }),
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/kendi cümlelerinle/i)).toBeNull();
  });

  it("selects a topic and shows the other-topic field when needed", async () => {
    const onSelectTopic = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <NeedTopicStep
        topics={STARTUP_CHOICES.topics}
        topicId="product"
        otherSummary=""
        onSelectTopic={onSelectTopic}
        onOtherSummaryChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Yatırım/ }));
    expect(onSelectTopic).toHaveBeenCalledWith("investment");

    rerender(
      <NeedTopicStep
        topics={STARTUP_CHOICES.topics}
        topicId="other"
        otherSummary=""
        onSelectTopic={onSelectTopic}
        onOtherSummaryChange={vi.fn()}
      />,
    );
    expect(
      screen.getByPlaceholderText(/kendi cümlelerinle/i),
    ).toBeInTheDocument();
  });
});
