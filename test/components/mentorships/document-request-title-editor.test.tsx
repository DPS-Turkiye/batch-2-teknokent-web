import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import {
  DocumentRequestTitleEditor,
  documentTitleRows,
  titlesOf,
  type DocumentTitleRow,
} from "@/components/mentorships/document-request-title-editor";
import { InLocale } from "@test/test-utils";

function Harness({ initial }: { initial: string[] }) {
  const [rows, setRows] = useState<DocumentTitleRow[]>(() =>
    documentTitleRows(initial),
  );
  return (
    <>
      <DocumentRequestTitleEditor rows={rows} onChange={setRows} />
      <output aria-label="titles">{titlesOf(rows).join("|")}</output>
    </>
  );
}

describe("DocumentRequestTitleEditor", () => {
  it("keeps the remaining row's own input when the row above it is removed", async () => {
    const user = userEvent.setup();
    render(
      <InLocale locale="tr">
        <Harness initial={["Pitch deck", "Finansal tablo"]} />
      </InLocale>,
    );
    const second = screen.getByDisplayValue("Finansal tablo");
    second.focus();

    const [removeFirst] = screen.getAllByRole("button", {
      name: "Belgeyi kaldır",
    });
    if (!removeFirst) throw new Error("No remove button");
    await user.click(removeFirst);

    // Keyed by position, the first input would now show the second title instead.
    expect(screen.getByDisplayValue("Finansal tablo")).toBe(second);
    expect(screen.getByLabelText("titles")).toHaveTextContent("Finansal tablo");
  });

  it("adds an empty row and sends plain titles to its owner", async () => {
    const user = userEvent.setup();
    render(
      <InLocale locale="tr">
        <Harness initial={["Pitch deck"]} />
      </InLocale>,
    );

    await user.click(screen.getByRole("button", { name: /Belge ekle/ }));
    const inputs = screen.getAllByRole("textbox");
    const added = inputs.at(-1);
    if (!added) throw new Error("No added row");
    await user.type(added, "Kap tablosu");

    expect(screen.getByLabelText("titles")).toHaveTextContent(
      "Pitch deck|Kap tablosu",
    );
  });
});
