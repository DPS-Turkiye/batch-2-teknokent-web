import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceQueryState } from "@/components/academician/workspace-query-state";

describe("WorkspaceQueryState", () => {
  it("says it is loading", () => {
    render(<WorkspaceQueryState isLoading error={null} onRetry={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Yükleniyor…");
  });

  it("offers a retry after a failed load", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <WorkspaceQueryState
        isLoading={false}
        error={new Error("down")}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Bilgiler yüklenemedi.",
    );
    await user.click(screen.getByRole("button", { name: "Tekrar dene" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("disables the retry while it runs and renders nothing once loaded", () => {
    const { rerender, container } = render(
      <WorkspaceQueryState
        isLoading={false}
        error={new Error("down")}
        onRetry={vi.fn()}
        isRetrying
      />,
    );
    expect(screen.getByRole("button", { name: "Tekrar dene" })).toBeDisabled();
    rerender(
      <WorkspaceQueryState isLoading={false} error={null} onRetry={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
