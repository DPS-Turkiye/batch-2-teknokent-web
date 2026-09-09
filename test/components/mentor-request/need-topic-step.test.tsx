import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NeedTopicStep } from "@/components/mentor-request/need-topic-step";

describe("NeedTopicStep", () => {
  it("renders the Figma Konu step copy and topics", () => {
    render(
      <NeedTopicStep
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
