import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BotStatusRenderer } from "@/components/assistant/bot-status-renderer";
import { BotStatus } from "@/types/assistant";

describe("BotStatusRenderer", () => {
  it("renders success helper text when status is ok", () => {
    render(<BotStatusRenderer status={BotStatus.Ok} error={null} />);

    expect(screen.getByText(/Bot gönderildi/i)).toBeInTheDocument();
  });

  it("renders provided error text when status is error", () => {
    render(
      <BotStatusRenderer status={BotStatus.Err} error="provider unavailable" />,
    );

    expect(screen.getByText("provider unavailable")).toBeInTheDocument();
  });

  it("renders fallback error text when status is error and no message provided", () => {
    render(<BotStatusRenderer status={BotStatus.Err} error={null} />);

    expect(screen.getByText("Failed to send bot")).toBeInTheDocument();
  });

  it("renders nothing while no status is available", () => {
    const { container } = render(
      <BotStatusRenderer status={null} error={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
