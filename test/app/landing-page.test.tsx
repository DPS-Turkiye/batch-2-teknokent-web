import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Home, { dynamic, generateMetadata } from "@/app/(public)/page";
import { styles } from "@/components/landing/landing-styles";
import { UserRole, type AppSession } from "@/interfaces/session";
import { InLocale } from "@test/test-utils";

let mockSession: AppSession | null = null;
let isLoading = false;

/** The scoped class landing.module.css gives one of the design's class names. */
function moduleClass(name: string) {
  const scoped = styles[name];
  if (!scoped) throw new Error(`landing.module.css has no .${name}`);
  return scoped;
}

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ isLoading, session: mockSession }),
}));

describe("Landing page", () => {
  beforeEach(() => {
    mockSession = null;
    isLoading = false;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("gives the ODTÜ deployment its own front page, without Teknokent's startup pitch", () => {
    vi.stubEnv("APP_EDITION", "ODTU");
    render(
      <InLocale locale="tr">
        <Home />
      </InLocale>,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Office Hours ve akran mentörlüğü tek yerde",
      }),
    ).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: "Giriş Yap" })) {
      expect(link).toHaveAttribute("href", "/login");
    }
    expect(screen.getAllByRole("link", { name: "Giriş Yap" })).toHaveLength(3);
    expect(
      screen.getByRole("link", { name: "İŞKUR öğrencisi olarak kaydol" }),
    ).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("link", { name: "Yardım" })).toHaveAttribute(
      "href",
      "mailto:info@menton.com.tr",
    );
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent),
    ).toEqual([
      "Randevu talep et",
      "Mentor bul",
      "Randevularını izle",
      "Danışmanına ulaş",
      "ODTÜ öğrencileri",
      "Akran mentorları",
      "ODTÜ akademisyenleri",
    ]);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "ODTÜ öğrencisi veya akademisyeni misin?",
      }),
    ).toBeInTheDocument();
  });

  it("names the page after the deployment's edition", async () => {
    expect(await generateMetadata()).toEqual({
      title: { absolute: "menton · ODTÜ Teknokent" },
    });

    vi.stubEnv("APP_EDITION", "ODTU");
    expect(await generateMetadata()).toEqual({
      title: { absolute: "menton · ODTÜ" },
    });
  });

  it("offers a signed-in ODTÜ visitor their workspace and no sign-up", () => {
    vi.stubEnv("APP_EDITION", "ODTU");
    mockSession = {
      userId: "u-1",
      email: "ayse@metu.edu.tr",
      fullName: "Ayşe Yılmaz",
      jobTitle: "",
      role: UserRole.Mentee,
    };
    render(
      <InLocale locale="tr">
        <Home />
      </InLocale>,
    );

    expect(
      screen.getAllByRole("link", { name: "Ayşe olarak devam et" }),
    ).toHaveLength(3);
    expect(
      screen.queryByRole("link", { name: "İŞKUR öğrencisi olarak kaydol" }),
    ).toBeNull();
  });

  it("renders per request so the CDN never hands phones the desktop page", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("shows the designer's sections with a separate header login action", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Girişiminiz için doğru desteğe, doğru zamanda ulaşın",
      }),
    ).toBeInTheDocument();
    for (const name of [
      "Son gelişmeler",
      "Mentorluk süreci nasıl işler?",
      "Mentorluk ve eğitim arasındaki fark nedir?",
      "Sıkça sorulan sorular",
      "Programınıza ve çalışma alanınıza erişin",
    ]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
    const signIn = screen.getAllByRole("link", { name: /Giriş Yap/ });
    expect(signIn).toHaveLength(1);
    signIn.forEach((link) => expect(link).toHaveAttribute("href", "/login"));
  });

  it("takes a signed-in visitor back to their workspace", () => {
    mockSession = {
      userId: "mentee-1",
      email: "ayse@example.com",
      fullName: "Ayşe Kaya",
      jobTitle: "",
      organizationId: "org-1",
      organizationName: "NovaMed",
      role: UserRole.Mentee,
    };
    render(<Home />);

    const links = screen.getAllByRole("link", { name: /Ayşe olarak devam et/ });
    links.forEach((link) => expect(link).toHaveAttribute("href", "/dashboard"));
    expect(
      screen.queryByRole("link", { name: /Giriş Yap/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Kayıt Ol" }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["tr", "Kayıt Ol", "Giriş Yap"],
    ["en", "Sign up", "Sign in"],
  ] as const)(
    "sends every signup action to the role chooser in %s",
    (locale, signupLabel, loginLabel) => {
      render(
        <InLocale locale={locale}>
          <Home />
        </InLocale>,
      );
      const header = within(screen.getByRole("banner"));
      expect(header.getByRole("link", { name: signupLabel })).toHaveAttribute(
        "href",
        "/signup",
      );
      expect(header.getByRole("link", { name: loginLabel })).toHaveAttribute(
        "href",
        "/login",
      );
      expect(header.getByRole("link", { name: loginLabel })).toHaveClass(
        moduleClass("btn-or"),
      );
      expect(header.getByRole("link", { name: signupLabel })).toHaveClass(
        moduleClass("btn-ghost"),
      );
      const signupLinks = screen.getAllByRole("link", { name: signupLabel });
      expect(signupLinks).toHaveLength(4);
      signupLinks.forEach((link) =>
        expect(link).toHaveAttribute("href", "/signup"),
      );
    },
  );

  it("keeps the main signup actions on /signup while the session loads", () => {
    isLoading = true;
    render(<Home />);

    const signupLinks = screen.getAllByRole("link", { name: "Kayıt Ol" });
    expect(signupLinks).toHaveLength(3);
    signupLinks.forEach((link) =>
      expect(link).toHaveAttribute("href", "/signup"),
    );
  });

  it("switches the mentoring steps from the list, including by keyboard", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const tabs = within(
      screen.getByRole("tablist", { name: "Mentorluk adımları" }),
    ).getAllByRole("tab");
    const [first, , third, fourth] = tabs;
    if (!first || !third || !fourth) throw new Error("Expected four steps.");
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Mentee / Startup")).toBeInTheDocument();

    await user.click(third);
    expect(third).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByText("Değer önerisi taslağının kritiği"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Mentor", { selector: "span" }),
    ).toBeInTheDocument();

    await user.keyboard("{ArrowDown}");
    expect(fourth).toHaveAttribute("aria-selected", "true");
    expect(fourth).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Duraklat" }));
    expect(screen.getByRole("button", { name: "Oynat" })).toBeInTheDocument();
  });

  it("opens and closes the FAQ answers, and the comparison link opens its answer", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const first = screen.getByRole("button", {
      name: "Platforma kimler giriş yapabilir?",
    });
    expect(first).toHaveAttribute("aria-expanded", "true");
    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "false");

    await user.click(
      screen.getByRole("link", {
        name: /Hangi desteğe ihtiyacım olduğunu nasıl anlarım/,
      }),
    );
    expect(
      screen.getByRole("button", {
        name: "Eğitim ve mentorluk arasındaki fark nedir?",
      }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});
