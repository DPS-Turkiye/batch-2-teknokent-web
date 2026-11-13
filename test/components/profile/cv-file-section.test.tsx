import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CvFileSection } from "@/components/profile/cv-file-section";
import type { CvFileState } from "@/hooks/use-cv-file";
import { InLocale } from "@test/test-utils";

function cvState(overrides: Partial<CvFileState> = {}): CvFileState {
  return {
    selected: null,
    storedName: "gulse-cv.pdf",
    storedIsPdf: true,
    choose: vi.fn<CvFileState["choose"]>(),
    canRead: true,
    consent: true,
    setConsent: vi.fn<CvFileState["setConsent"]>(),
    canFill: true,
    offerFill: true,
    fillFromStored: vi.fn<CvFileState["fillFromStored"]>(),
    isUploading: false,
    isParsing: false,
    error: null,
    filled: false,
    ...overrides,
  };
}

function renderSection(cv: CvFileState) {
  return render(
    <InLocale locale="tr">
      <CvFileSection
        cv={cv}
        accent="orange"
        whoSees="Koordinatörler görür."
        filledMessage="Dolduruldu."
      />
    </InLocale>,
  );
}

describe("CvFileSection", () => {
  it("offers to fill the profile from the CV on file", () => {
    renderSection(cvState());

    expect(
      screen.getByRole("button", { name: "Profili CV'den doldur" }),
    ).toBeEnabled();
  });

  it("explains the manual path instead of offering to read the CV when parsing is switched off", () => {
    renderSection(cvState({ canRead: false, consent: false, canFill: false }));

    expect(
      screen.queryByRole("button", { name: "Profili CV'den doldur" }),
    ).toBeNull();
    expect(
      screen.getByText(
        "Bu sistemde CV otomatik okunmuyor; dosyan yalnızca kaydedilir. Profil bilgilerini kendin gir.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("asks for consent with an unticked box, and hands a tick to the hook", async () => {
    const cv = cvState({ consent: false, canFill: false });
    renderSection(cv);

    const box = screen.getByRole("checkbox", { name: /CV'min okunmasını/ });
    expect(box).not.toBeChecked();
    expect(
      screen.getByRole("button", { name: "Profili CV'den doldur" }),
    ).toBeDisabled();
    await userEvent.click(box);

    expect(cv.setConsent).toHaveBeenCalledWith(true);
  });

  it("hides the fill button once nothing is on offer", () => {
    renderSection(cvState({ offerFill: false }));

    expect(
      screen.queryByRole("button", { name: "Profili CV'den doldur" }),
    ).toBeNull();
  });
});
