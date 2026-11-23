import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { FormattedTextEditor } from "@/components/email-center/formatted-text-editor";
import { renderWithQueryClient } from "@test/test-utils";

it("starts with the given text and reports its formatting", async () => {
  const onChange = vi.fn<(html: string) => void>();
  renderWithQueryClient(
    <FormattedTextEditor
      html="<p>Merhaba</p>"
      disabled={false}
      onChange={onChange}
    />,
  );
  expect(
    await screen.findByRole("textbox", { name: "E-posta metni" }),
  ).toHaveTextContent("Merhaba");
  await userEvent.click(screen.getByRole("button", { name: "Madde listesi" }));
  expect(onChange.mock.lastCall?.[0]).toContain("<ul>");
  expect(screen.getByRole("button", { name: "Madde listesi" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await userEvent.click(screen.getByRole("button", { name: "Numaralı liste" }));
  expect(onChange.mock.lastCall?.[0]).toContain("<ol>");
  await userEvent.click(screen.getByRole("button", { name: "Kalın" }));
  await userEvent.click(screen.getByRole("button", { name: "İtalik" }));
});
