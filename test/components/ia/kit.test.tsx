import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, ButtonSize, ButtonVariant } from "@/components/ia/button";
import { Card } from "@/components/ia/card";
import { InlineAlert } from "@/components/ia/inline-alert";
import { PageHeader } from "@/components/ia/page-header";
import { ProgramTypeBadge } from "@/components/ia/program-type-badge";
import { SimpleHeader } from "@/components/ia/simple-header";
import { StatusBadge, StatusTone } from "@/components/ia/status-badge";
import { StepPills } from "@/components/ia/step-pills";
import { ProgramType } from "@/interfaces/program";
import { InLocale } from "@test/test-utils";

describe("IA kit", () => {
  it("renders a button that calls back, and a link when given an href", async () => {
    const onClick = vi.fn();
    render(
      <>
        <Button onClick={onClick}>Devam Et</Button>
        <Button
          href="/admin/programs"
          variant={ButtonVariant.Ghost}
          size={ButtonSize.Small}
        >
          Vazgeç
        </Button>
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Devam Et" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Vazgeç" })).toHaveAttribute(
      "href",
      "/admin/programs",
    );
  });

  it("keeps a disabled button with an href a button, so it cannot be followed", () => {
    render(
      <Button href="/student" disabled variant={ButtonVariant.Destructive}>
        Sil
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Sil" })).toBeDisabled();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("passes native attributes through on both the button and the link", () => {
    render(
      <>
        <Button aria-label="Programı kaydet" data-tour="save" name="save">
          Kaydet
        </Button>
        <Button
          href="/admin/programs"
          aria-label="Programlara dön"
          data-tour="back"
          target="_blank"
          rel="noreferrer"
        >
          Geri
        </Button>
      </>,
    );

    const button = screen.getByRole("button", { name: "Programı kaydet" });
    expect(button).toHaveAttribute("data-tour", "save");
    expect(button).toHaveAttribute("name", "save");
    expect(button).toHaveAttribute("type", "button");
    const link = screen.getByRole("link", { name: "Programlara dön" });
    expect(link).toHaveAttribute("data-tour", "back");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("keeps aria and data attributes on a disabled link but drops link-only ones and the click", async () => {
    const onClick = vi.fn();
    render(
      <Button
        href="/student"
        disabled
        aria-label="Kaydı sil"
        data-tour="delete"
        target="_blank"
        onClick={onClick}
      >
        Sil
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Kaydı sil" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-tour", "delete");
    expect(button).not.toHaveAttribute("target");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("announces an error alert as an alert and other tones as status", () => {
    render(
      <>
        <InlineAlert tone={StatusTone.Error} title="Giriş yapılamadı">
          Lütfen tekrar dene.
        </InlineAlert>
        <InlineAlert tone={StatusTone.Info} title="Bilgi" />
        <InlineAlert tone={StatusTone.Success}>Kaydedildi.</InlineAlert>
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Giriş yapılamadıLütfen tekrar dene.",
    );
    expect(
      screen.getAllByRole("status").map((node) => node.textContent),
    ).toEqual(["Bilgi", "Kaydedildi."]);
  });

  it("marks the current step and checks off the finished ones", () => {
    render(
      <StepPills
        label="Adımlar"
        currentIndex={1}
        steps={[
          { key: "type", label: "Program türü" },
          { key: "info", label: "Program bilgileri" },
          { key: "summary", label: "Özet ve kaydet" },
        ]}
      />,
    );

    const steps = screen.getAllByRole("listitem");
    expect(steps.map((step) => step.textContent)).toEqual([
      "Program türü(adım 1, tamamlandı)",
      "2Program bilgileri(adım 2)",
      "3Özet ve kaydet(adım 3)",
    ]);
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent(
      "Program bilgileri",
    );
    // Pending steps use text-secondary: text-muted on background-muted is 4.02:1, under AA.
    const pending = steps[2]!;
    const pill = pending.querySelector(":scope > span:last-child");
    expect(pill).toHaveClass("text-text-secondary");
    expect(pill?.querySelector(":scope > span")).toHaveClass(
      "bg-background-muted",
      "text-text-secondary",
    );
    expect(pending.querySelector(".text-text-muted")).toBeNull();
  });

  it("names a program type in the reader's language", () => {
    render(
      <InLocale locale="tr">
        <ProgramTypeBadge type={ProgramType.OfficeHours} />
        <ProgramTypeBadge type={ProgramType.PeerMentoring} />
        <ProgramTypeBadge type={ProgramType.StartupMentoring} />
      </InLocale>,
    );

    expect(screen.getByText("Office Hours")).toBeInTheDocument();
    expect(screen.getByText("Akran Mentörlüğü")).toBeInTheDocument();
    expect(screen.getByText("Girişim Mentörlüğü")).toBeInTheDocument();
  });

  it("shows a page title with its back link, actions, status and a labelled card", () => {
    render(
      <>
        <PageHeader
          title="Yeni Program Oluştur"
          back={{ href: "/admin/programs", label: "Programlar" }}
          actions={<Button>Kaydet</Button>}
        >
          <StatusBadge tone={StatusTone.Warning}>Taslak</StatusBadge>
        </PageHeader>
        <Card featured compact labelledBy="card-title">
          <h2 id="card-title">Özet</h2>
        </Card>
      </>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Yeni Program Oluştur" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Programlar" })).toHaveAttribute(
      "href",
      "/admin/programs",
    );
    expect(screen.getByRole("button", { name: "Kaydet" })).toBeInTheDocument();
    expect(screen.getByText("Taslak")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Özet" })).toBeInTheDocument();
  });

  it("renders a header without a back link or actions", () => {
    render(<PageHeader title="Programlarım" />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Programlarım" }),
    ).toBeInTheDocument();
  });

  it("offers help in the plain header and signs out only when it can", async () => {
    const onLogout = vi.fn();
    const { rerender } = render(
      <InLocale locale="tr">
        <SimpleHeader
          helpHref="mailto:info@menton.com.tr"
          onLogout={onLogout}
        />
      </InLocale>,
    );

    expect(screen.getByRole("link", { name: "Yardım" })).toHaveAttribute(
      "href",
      "mailto:info@menton.com.tr",
    );
    await userEvent.click(screen.getByRole("button", { name: "Çıkış yap" }));
    expect(onLogout).toHaveBeenCalledTimes(1);

    rerender(
      <InLocale locale="tr">
        <SimpleHeader
          helpHref="mailto:info@menton.com.tr"
          onLogout={onLogout}
          loggingOut
        />
      </InLocale>,
    );
    expect(
      screen.getByRole("button", { name: "Çıkış yapılıyor…" }),
    ).toBeDisabled();

    rerender(
      <InLocale locale="tr">
        <SimpleHeader helpHref="mailto:info@iskur.example" />
      </InLocale>,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Yardım" })).toHaveAttribute(
      "href",
      "mailto:info@iskur.example",
    );
  });
});
