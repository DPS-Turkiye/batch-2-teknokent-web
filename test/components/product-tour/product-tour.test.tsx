import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductTour } from "@/components/product-tour/product-tour";
import { ProductTourReplayButton } from "@/components/product-tour/product-tour-replay-button";
import { TARGET_WAIT_MS } from "@/hooks/use-tour-target";
import type { AppSession } from "@/interfaces/session";
import { IdentityKind, UserRole } from "@/interfaces/session";
import { Workspace } from "@/interfaces/workspace";
import { fetchInstitutionRecord } from "@/lib/client/institution";
import {
  readTourOutcome,
  writeTourOutcome,
} from "@/lib/product-tour-storage";
import { TourOutcome, TourRole } from "@/types/product-tour";
import {
  institutionRecord,
  odtuSession,
  resetProductTour,
  seedTourStep,
} from "@test/fixtures/product-tour";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

let pathname = "/student";
let session: AppSession | null = odtuSession();
const push = vi.fn<(href: string) => void>();

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => session,
}));
vi.mock("@/lib/client/institution", () => ({
  fetchInstitutionRecord: vi.fn(),
  fetchInstitutionAdvisees: vi.fn(),
}));

const ACADEMICIAN = odtuSession({
  userId: "academic-1",
  role: UserRole.Academician,
  institutionKinds: [IdentityKind.Academic],
});

function renderTour(workspace: Workspace, page: ReactNode = null) {
  return renderWithQueryClient(
    <InLocale locale="tr">
      {page}
      <ProductTour workspace={workspace} />
    </InLocale>,
  );
}

/** Lets the institution record arrive and the tour decide. */
async function flushQueries() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function stepCard() {
  return screen.getByRole("dialog", { name: /./ });
}

beforeEach(() => {
  resetProductTour();
  pathname = "/student";
  session = odtuSession();
  push.mockReset();
  vi.mocked(fetchInstitutionRecord)
    .mockReset()
    .mockResolvedValue(institutionRecord());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ProductTour welcome", () => {
  it("opens by itself on a student's home page the first time", async () => {
    renderTour(Workspace.OdtuStudent);
    expect(
      await screen.findByRole("dialog", {
        name: "İlk randevunu birlikte alalım",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Office Hours'a git")).toBeInTheDocument();
  });

  it("gives an İŞKUR participant the peer-mentoring tour", async () => {
    vi.mocked(fetchInstitutionRecord).mockResolvedValue(
      institutionRecord({ iskurParticipant: true }),
    );
    renderTour(Workspace.OdtuStudent);
    expect(
      await screen.findByRole("dialog", {
        name: "İlk mentorluk talebini yanıtlayalım",
      }),
    ).toBeInTheDocument();
  });

  it("opens the academician tour on the academician home without asking for a record", async () => {
    session = ACADEMICIAN;
    pathname = "/academician";
    renderTour(Workspace.OdtuAcademician);
    expect(
      await screen.findByRole("dialog", {
        name: "Office Hours'a hazırlanalım",
      }),
    ).toBeInTheDocument();
    expect(fetchInstitutionRecord).not.toHaveBeenCalled();
  });

  it("stays closed away from the home page, once seen, and for workspaces without a tour", async () => {
    pathname = "/student/profile";
    const { unmount } = renderTour(Workspace.OdtuStudent);
    await flushQueries();
    expect(fetchInstitutionRecord).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    unmount();

    pathname = "/student";
    writeTourOutcome("student-1", TourRole.Student, TourOutcome.Completed);
    const second = renderTour(Workspace.OdtuStudent);
    await flushQueries();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    second.unmount();

    renderTour(Workspace.GirisimMentee);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("waits for the session before deciding", () => {
    session = null;
    renderTour(Workspace.OdtuStudent);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("remembers Şimdilik Atla and does not open again", async () => {
    const user = userEvent.setup();
    renderTour(Workspace.OdtuStudent);
    await user.click(
      await screen.findByRole("button", { name: "Şimdilik Atla" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(readTourOutcome("student-1", TourRole.Student)).toBe(
      TourOutcome.Skipped,
    );
  });
});

describe("ProductTour steps", () => {
  it("highlights the menu item and moves on when the user clicks it", async () => {
    const user = userEvent.setup();
    renderTour(
      Workspace.OdtuStudent,
      <a href="#office-hours" data-tour="nav-officeHours">
        Office Hours
      </a>,
    );
    await user.click(
      await screen.findByRole("button", { name: "Turu Başlat" }),
    );

    const card = stepCard();
    expect(within(card).getByText("Adım 1 / 5")).toBeInTheDocument();
    expect(
      within(card).getByRole("progressbar", { name: "Tur ilerlemesi" }),
    ).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByText("Adım 1 / 5: Office Hours'a git")).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(screen.getByTestId("tour-pane-top")).toBeInTheDocument();
    expect(
      within(card).queryByRole("button", { name: "İleri" }),
    ).not.toBeInTheDocument();

    await user.click(
      within(card).getByRole("button", { name: "Office Hours'a tıkla" }),
    );
    expect(screen.getByRole("link", { name: "Office Hours" })).toHaveFocus();

    await user.click(screen.getByRole("link", { name: "Office Hours" }));
    expect(
      within(stepCard()).getByRole("heading", { name: "Bir akademisyen seç" }),
    ).toBeInTheDocument();
    expect(within(stepCard()).getByText("Adım 2 / 5")).toBeInTheDocument();
  });

  it("offers İleri when the element is not a control a keyboard can press", async () => {
    session = ACADEMICIAN;
    pathname = "/academician/availability";
    seedTourStep("academic-1", TourRole.Academician, 1);
    const user = userEvent.setup();
    renderTour(
      Workspace.OdtuAcademician,
      <section data-tour="availability-weekly">Haftalık saatler</section>,
    );
    const card = await screen.findByRole("dialog", {
      name: "Haftalık saatlerini ekle",
    });
    expect(
      within(card).queryByRole("button", {
        name: "Haftalık saatlerine tıkla",
      }),
    ).not.toBeInTheDocument();
    await user.click(within(card).getByRole("button", { name: "İleri" }));
    expect(
      screen.getByRole("dialog", { name: "Gelen talebi aç" }),
    ).toBeInTheDocument();
  });

  it("carries on without the element after a wait, and opens the step's page", () => {
    vi.useFakeTimers();
    session = ACADEMICIAN;
    pathname = "/academician/profile";
    seedTourStep("academic-1", TourRole.Academician, 0);
    renderTour(Workspace.OdtuAcademician);
    expect(
      screen.queryByText(
        "Bu adımın alanı şu an ekranda yok; İleri ile devam edebilirsin.",
      ),
    ).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(TARGET_WAIT_MS);
    });
    expect(
      screen.getByText(
        "Bu adımın alanı şu an ekranda yok; İleri ile devam edebilirsin.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("tour-backdrop")).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/academician");

    fireEvent.click(screen.getByRole("button", { name: "İleri" }));
    expect(
      screen.getByRole("dialog", { name: "Haftalık saatlerini ekle" }),
    ).toBeInTheDocument();
  });

  it("skips the tour with Turu atla and remembers it", async () => {
    seedTourStep("student-1", TourRole.Student, 2);
    const user = userEvent.setup();
    renderTour(Workspace.OdtuStudent);
    const card = await screen.findByRole("dialog", { name: "Gün ve saat seç" });
    await user.click(within(card).getByRole("button", { name: "Turu atla" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(readTourOutcome("student-1", TourRole.Student)).toBe(
      TourOutcome.Skipped,
    );
  });

  it("closes with the X and with Escape like Turu atla", async () => {
    seedTourStep("student-1", TourRole.Student, 1);
    const user = userEvent.setup();
    const { unmount } = renderTour(Workspace.OdtuStudent);
    const card = await screen.findByRole("dialog", {
      name: "Bir akademisyen seç",
    });
    await user.click(within(card).getByRole("button", { name: "Turu kapat" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    unmount();

    resetProductTour();
    seedTourStep("student-1", TourRole.Student, 1);
    renderTour(Workspace.OdtuStudent);
    const again = await screen.findByRole("dialog", {
      name: "Bir akademisyen seç",
    });
    fireEvent.keyDown(again, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("ProductTour end", () => {
  it("finishes with Turu Bitir, then leads home and remembers it", async () => {
    pathname = "/student/appointments";
    seedTourStep("student-1", TourRole.Student, 4);
    const user = userEvent.setup();
    renderTour(
      Workspace.OdtuStudent,
      <div data-tour="appointment-request-sent">Randevu talebin gönderildi</div>,
    );
    const card = await screen.findByRole("dialog", {
      name: "Talebin gönderildi",
    });
    expect(
      within(card).queryByRole("button", { name: "İleri" }),
    ).not.toBeInTheDocument();
    await user.click(within(card).getByRole("button", { name: "Turu Bitir" }));

    const end = screen.getByRole("dialog", { name: "Hazırsın!" });
    expect(
      within(end).getByText("Turu Profilim'den tekrar izleyebilirsin."),
    ).toBeInTheDocument();
    await user.click(
      within(end).getByRole("button", { name: "Ana Sayfa'ya Dön" }),
    );
    expect(push).toHaveBeenCalledWith("/student");
    expect(readTourOutcome("student-1", TourRole.Student)).toBe(
      TourOutcome.Completed,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ends the academician tour on the Kabul Et click and goes to Randevularım", async () => {
    session = ACADEMICIAN;
    pathname = "/academician/appointments";
    seedTourStep("academic-1", TourRole.Academician, 3);
    const user = userEvent.setup();
    renderTour(
      Workspace.OdtuAcademician,
      <button type="button" data-tour="request-drawer-accept">
        Kabul Et
      </button>,
    );
    await screen.findByRole("dialog", { name: "Talebi yanıtla" });
    await user.click(screen.getByRole("button", { name: "Kabul Et" }));
    const end = screen.getByRole("dialog", { name: "Hazırsın!" });
    await user.click(
      within(end).getByRole("button", { name: "Randevularım'a Dön" }),
    );
    expect(push).toHaveBeenCalledWith("/academician/appointments");
  });

  it("counts closing the end dialog with Escape as finished, without leaving the page", async () => {
    pathname = "/student/appointments";
    seedTourStep("student-1", TourRole.Student, 4);
    const user = userEvent.setup();
    renderTour(Workspace.OdtuStudent);
    const card = await screen.findByRole("dialog", {
      name: "Talebin gönderildi",
    });
    await user.click(within(card).getByRole("button", { name: "Turu Bitir" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(readTourOutcome("student-1", TourRole.Student)).toBe(
      TourOutcome.Completed,
    );
  });
});

describe("ProductTourReplayButton", () => {
  it("opens the tour again from Profilim after it was finished", async () => {
    pathname = "/student/profile";
    writeTourOutcome("student-1", TourRole.Student, TourOutcome.Completed);
    const user = userEvent.setup();
    renderTour(
      Workspace.OdtuStudent,
      <ProductTourReplayButton workspace={Workspace.OdtuStudent} />,
    );
    await user.click(
      await screen.findByRole("button", { name: "Turu tekrar izle" }),
    );
    expect(
      screen.getByRole("dialog", { name: "İlk randevunu birlikte alalım" }),
    ).toBeInTheDocument();
  });

  it("is not shown in a workspace without a tour", () => {
    renderWithQueryClient(
      <InLocale locale="tr">
        <ProductTourReplayButton workspace={Workspace.GirisimMentee} />
      </InLocale>,
    );
    expect(
      screen.queryByRole("button", { name: "Turu tekrar izle" }),
    ).not.toBeInTheDocument();
  });
});
