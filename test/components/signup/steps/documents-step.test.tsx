import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, expect, it, vi } from "vitest";

import { DocumentsStep } from "@/components/signup/steps/documents-step";
import {
  emptySignupDraft,
  useStartupDraftEditors,
} from "@/hooks/use-startup-draft";
import { useStoredDocuments } from "@/hooks/use-stored-documents";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-stored-documents", () => ({
  useStoredDocuments: vi.fn(),
}));

function Step() {
  const [draft, setDraft] = useState(emptySignupDraft);
  const editors = useStartupDraftEditors(setDraft);
  return (
    <DocumentsStep
      wizard={{ ...editors, draft, supportAreaLimitReached: false }}
    />
  );
}

beforeEach(() => {
  vi.mocked(useStoredDocuments).mockReturnValue({
    byKind: () => null,
    isLoading: false,
  });
});

it("shows each document's formats and size under its field", () => {
  renderWithQueryClient(<Step />);

  expect(
    screen.getByText("PDF veya DOCX · en fazla 25 MB"),
  ).toBeInTheDocument();
  expect(
    screen.getByText("PDF veya PPTX · en fazla 25 MB"),
  ).toBeInTheDocument();
  expect(
    screen.getByText("PDF, DOCX veya PPTX · en fazla 25 MB"),
  ).toBeInTheDocument();
});

it("keeps a refused MVP video out of the draft and takes an accepted pitch deck", async () => {
  const user = userEvent.setup({ applyAccept: false });
  renderWithQueryClient(<Step />);

  await user.upload(
    screen.getByLabelText("MVP / Prototip dosyası seç"),
    new File(["video"], "mvp.avi", { type: "video/x-msvideo" }),
  );
  await user.upload(
    screen.getByLabelText("Pitch Deck dosyası seç"),
    new File(["deck"], "deck.pdf", { type: "application/pdf" }),
  );

  expect(screen.getByRole("alert")).toHaveTextContent(
    "Video dosyası yüklenemiyor.",
  );
  expect(screen.queryByText("mvp.avi")).toBeNull();
  expect(screen.getByText("deck.pdf")).toBeInTheDocument();
});
