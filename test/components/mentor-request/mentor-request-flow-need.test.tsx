import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorRequestFlow } from "@/components/mentor-request/mentor-request-flow";
import { UserRole } from "@/interfaces/session";
import type { StartupContext } from "@/interfaces/startup";
import { MENTOR_REQUEST_NEED_DRAFT_KEY } from "@/lib/mentor-request-need";
import { renderWithQueryClient } from "@test/test-utils";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => ({
    userId: "user-1",
    email: "sudenaz@example.com",
    fullName: "Sudenaz Yılmaz",
    jobTitle: "Mentee",
    role: UserRole.Mentee,
    organizationId: "org-1",
    organizationName: "Team TNT",
  }),
}));

const startup: StartupContext = {
  organizationId: "org-1",
  name: "Team TNT",
  summary: "B2B, SaaS Mentör-Mentee Platformu",
  sector: "",
  stage: "",
  technologies: [],
  confirmedProfile: false,
};

describe("MentorRequestFlow — Need step", () => {
  beforeEach(() => {
    push.mockReset();
    sessionStorage.clear();
  });

  it("opens the Figma İhtiyacını Belirle first step", () => {
    renderWithQueryClient(<MentorRequestFlow mentors={[]} startup={startup} />);

    expect(
      screen.getByRole("heading", {
        name: "Şu an seni en çok zorlayan şey ne?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Hangi alanda destek istiyorsunuz?"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/yürütecek/)).not.toBeInTheDocument();
    expect(screen.queryByText("Mentorluk biçimi")).not.toBeInTheDocument();
    expect(screen.queryByText("Startup Bilgileri")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Devam et" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Taslak Olarak Kaydet" }),
    ).toBeInTheDocument();
  });

  it("saves the selected topic as a draft and returns to Mentorluklarım", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorRequestFlow mentors={[]} startup={startup} />);

    await user.click(screen.getByRole("button", { name: /Büyüme & Satış/ }));
    await user.click(
      screen.getByRole("button", { name: "Taslak Olarak Kaydet" }),
    );

    expect(
      JSON.parse(sessionStorage.getItem(MENTOR_REQUEST_NEED_DRAFT_KEY)!),
    ).toEqual({
      topicId: "growth",
      otherSummary: "",
      situationId: "onboarding",
      noneSummary: "",
      goalIds: ["next-steps"],
      goalNote: "",
    });
    expect(push).toHaveBeenCalledWith("/mentorships");
  });

  it("restores a saved topic when returning to the step", () => {
    sessionStorage.setItem(
      MENTOR_REQUEST_NEED_DRAFT_KEY,
      JSON.stringify({ topicId: "finance", otherSummary: "" }),
    );

    renderWithQueryClient(<MentorRequestFlow mentors={[]} startup={startup} />);

    expect(
      screen.getByRole("button", { name: /İş Modeli & Finans/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps Devam et disabled until Başka bir konu has a written note", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorRequestFlow mentors={[]} startup={startup} />);

    await user.click(screen.getByRole("button", { name: /Başka bir konu/ }));
    expect(screen.getByRole("button", { name: "Devam et" })).toBeDisabled();

    await user.type(
      screen.getByPlaceholderText(/kendi cümlelerinle/i),
      "Yasal süreç",
    );
    expect(screen.getByRole("button", { name: "Devam et" })).toBeEnabled();
  });

  it("opens the Figma Durum step after Devam et", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorRequestFlow mentors={[]} startup={startup} />);

    await user.click(screen.getByRole("button", { name: "Devam et" }));

    expect(
      screen.getByRole("heading", {
        name: "Hangisi yaşadığın duruma daha yakın?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Şu an seni en çok zorlayan şey ne?",
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Mentorluk biçimi")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Onboarding sırasında kullanıcı kaybediyoruz/,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Devam et" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Taslak Olarak Kaydet" }),
    ).toBeInTheDocument();
  });

  it("opens the Figma Hedef step after Durum Devam et", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorRequestFlow mentors={[]} startup={startup} />);

    await user.click(screen.getByRole("button", { name: "Devam et" }));
    await user.click(screen.getByRole("button", { name: "Devam et" }));

    expect(
      screen.getByRole("heading", {
        name: "Bu görüşmenin sonunda neyin netleşmesini istersin?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Hangisi yaşadığın duruma daha yakın?",
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Ekip Üyeleri")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bir sonraki adımları belirlemek" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("opens the Figma Özet step after Hedef Devam et", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorRequestFlow mentors={[]} startup={startup} />);

    await user.click(screen.getByRole("button", { name: "Devam et" }));
    await user.click(screen.getByRole("button", { name: "Devam et" }));
    await user.click(screen.getByRole("button", { name: "Devam et" }));

    expect(
      screen.getByRole("heading", { name: "Seni doğru anladık mı?" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Bu görüşmenin sonunda neyin netleşmesini istersin?",
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Ürün")).toBeInTheDocument();
    expect(screen.getByText("Team TNT")).toBeInTheDocument();
    expect(screen.getByText("Onboarding")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Taslak Olarak Kaydet" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Devam et" })).toBeEnabled();
  });

  it("returns to Konu from Özet Düzenle", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorRequestFlow mentors={[]} startup={startup} />);

    await user.click(screen.getByRole("button", { name: "Devam et" }));
    await user.click(screen.getByRole("button", { name: "Devam et" }));
    await user.click(screen.getByRole("button", { name: "Devam et" }));
    await user.click(
      screen.getByRole("button", { name: "İhtiyacını düzenle" }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Şu an seni en çok zorlayan şey ne?",
      }),
    ).toBeInTheDocument();
  });

  it("returns to the Konu step from Durum", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorRequestFlow mentors={[]} startup={startup} />);

    await user.click(screen.getByRole("button", { name: "Devam et" }));
    await user.click(
      within(screen.getByLabelText("İhtiyaç belirleme adımları")).getByRole(
        "button",
        { name: /Konu/ },
      ),
    );

    expect(
      screen.getByRole("heading", {
        name: "Şu an seni en çok zorlayan şey ne?",
      }),
    ).toBeInTheDocument();
  });
});
