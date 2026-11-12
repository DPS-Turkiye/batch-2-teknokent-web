import { render, screen } from "@testing-library/react";
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
    canFill: true,
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
    renderSection(cvState({ canRead: false, canFill: false }));

    expect(
      screen.queryByRole("button", { name: "Profili CV'den doldur" }),
    ).toBeNull();
    expect(
      screen.getByText(
        "Bu sistemde CV otomatik okunmuyor; dosyan yalnızca kaydedilir. Profil bilgilerini kendin gir.",
      ),
    ).toBeInTheDocument();
  });
});
