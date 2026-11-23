import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FormattedTextEditor } from "@/components/email-center/formatted-text-editor";
import { renderWithQueryClient } from "@test/test-utils";

function open(html: string) {
  const onChange = vi.fn<(html: string) => void>();
  renderWithQueryClient(
    <FormattedTextEditor html={html} disabled={false} onChange={onChange} />,
  );
  return { onChange, last: () => onChange.mock.lastCall?.[0] ?? "" };
}

const text = () => screen.findByRole("textbox", { name: "E-posta metni" });
const press = (name: string) =>
  userEvent.click(screen.getByRole("button", { name }));
const dialog = () => screen.getByRole("dialog");
const address = () => within(dialog()).getByLabelText("Adres");

describe("the text of a mail", () => {
  it("starts with the given text and reports its formatting", async () => {
    const { last } = open("<p>Merhaba</p>");
    expect(await text()).toHaveTextContent("Merhaba");
    await press("Madde listesi");
    expect(last()).toContain("<ul>");
    expect(
      screen.getByRole("button", { name: "Madde listesi" }),
    ).toHaveAttribute("aria-pressed", "true");
    await press("Numaralı liste");
    expect(last()).toContain("<ol>");
    await press("Kalın");
    await press("İtalik");
  });

  it("adds a link with its own words, a bare domain as https", async () => {
    const { last } = open("<p></p>");
    await text();
    await press("Bağlantı ekle");
    expect(dialog()).toHaveAccessibleName("Bağlantı ekle");
    expect(address()).toHaveFocus();
    await userEvent.type(address(), "menton.com.tr/invite");
    await userEvent.type(
      within(dialog()).getByLabelText(/Görünen metin/),
      "Kayıt ol{Enter}",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(last()).toContain('href="https://menton.com.tr/invite"');
    expect(last()).toContain(">Kayıt ol</a>");
  });

  it("shows the address itself when there are no words", async () => {
    const { last } = open("<p></p>");
    await text();
    await press("Bağlantı ekle");
    await userEvent.type(address(), "menton.com.tr");
    await press("Ekle");
    expect(last()).toContain(">menton.com.tr</a>");
  });

  it.each([
    ["http://eski.example", /http:\/\/ güvenli olmadığı için/],
    ["kisi@ornek.example", /E-posta adresi bağlantı olamaz/],
    ["javascript:alert(1)", /Bu tür adres kullanılamaz/],
    ["menton", /web adresine benzemiyor/],
  ])("says why %s cannot be used and adds nothing", async (typed, why) => {
    const { onChange } = open("<p></p>");
    await text();
    onChange.mockClear();
    await press("Bağlantı ekle");
    await userEvent.type(address(), typed);
    await press("Ekle");
    expect(within(dialog()).getByRole("alert")).toHaveTextContent(why);
    expect(address()).toBeInvalid();
    expect(address()).toHaveAccessibleDescription(why);
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.type(address(), "x");
    expect(within(dialog()).getByRole("alert")).toBeEmptyDOMElement();
  });

  it("wants an address, and is closed without one by Escape", async () => {
    const { onChange } = open("<p></p>");
    await text();
    onChange.mockClear();
    await press("Bağlantı ekle");
    await press("Ekle");
    expect(within(dialog()).getByRole("alert")).toHaveTextContent(
      "Bir adres yaz.",
    );
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("changes and removes the link under the cursor", async () => {
    const { last } = open('<p><a href="https://bir.example">Kayıt ol</a></p>');
    fireEvent.keyDown(await text(), { key: "a", ctrlKey: true });
    await press("Bağlantıyı düzenle");
    expect(address()).toHaveValue("https://bir.example");
    expect(
      within(dialog()).queryByLabelText(/Görünen metin/),
    ).not.toBeInTheDocument();
    await userEvent.clear(address());
    await userEvent.type(address(), "https://iki.example");
    await press("Kaydet");
    expect(last()).toContain('href="https://iki.example"');
    expect(last()).toContain("Kayıt ol</a>");
    await press("Bağlantıyı düzenle");
    await press("Bağlantıyı kaldır");
    expect(last()).not.toContain("<a");
    expect(last()).toContain("Kayıt ol");
  });

  it("warns of an http address instead of linking it", async () => {
    open(
      '<p>bak http://eski.example ve <a href="http://eski.example">şu</a></p>',
    );
    const editor = await text();
    await waitFor(() => {
      expect(screen.getByText(/alıcı tıklayamaz/)).toBeInTheDocument();
    });
    expect(editor.querySelector("a")).toBeNull();
  });

  it("warns of a pasted http link whose words would lose it", async () => {
    open("<p></p>");
    fireEvent.paste(await text(), {
      clipboardData: {
        files: [],
        types: ["text/html"],
        getData: (type: string) =>
          type === "text/html" ? '<a href="http://eski.example">Kayıt</a>' : "",
      },
    });
    expect(await screen.findByText(/alıcı tıklayamaz/)).toBeInTheDocument();
  });

  it("does not warn of an https address", async () => {
    open("<p>bak https://yeni.example</p>");
    await text();
    expect(screen.queryByText(/alıcı tıklayamaz/)).not.toBeInTheDocument();
  });
});
