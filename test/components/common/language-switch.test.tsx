import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LanguageSwitch } from "@/components/common/language-switch";
import { LOCALE_COOKIE } from "@/lib/i18n";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

describe("LanguageSwitch", () => {
  beforeEach(() => {
    refresh.mockClear();
    document.cookie = `${LOCALE_COOKIE}=; max-age=0; path=/`;
  });

  it("stays hidden while English is switched off", () => {
    const { container } = render(<LanguageSwitch enabled={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("remembers the chosen language and reloads the page in it", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitch enabled />);

    expect(screen.getByRole("button", { name: "Türkçe" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "English" }));

    expect(document.cookie).toContain(`${LOCALE_COOKIE}=en`);
    expect(refresh).toHaveBeenCalledOnce();
  });
});
