import { describe, expect, it } from "vitest";

import {
  attachmentFilename,
  contentDispositionHeader,
} from "@/lib/content-disposition";

describe("contentDispositionHeader", () => {
  it("keeps an ASCII name in filename and filename*", () => {
    expect(contentDispositionHeader("inline", "min.pdf")).toBe(
      "inline; filename=\"min.pdf\"; filename*=UTF-8''min.pdf",
    );
  });

  it("puts Turkish characters in the RFC 5987 filename* parameter", () => {
    expect(contentDispositionHeader("inline", "Toplantı.pdf")).toBe(
      "inline; filename=\"Toplant_.pdf\"; filename*=UTF-8''Toplant%C4%B1.pdf",
    );
  });
});

describe("attachmentFilename", () => {
  it("reads the RFC 5987 name first, so Turkish letters survive", () => {
    expect(
      attachmentFilename(contentDispositionHeader("attachment", "Katılım.csv")),
    ).toBe("Katılım.csv");
  });

  it("falls back to the plain name, quoted or not", () => {
    expect(attachmentFilename('attachment; filename="rapor.xlsx"')).toBe(
      "rapor.xlsx",
    );
    expect(attachmentFilename("attachment; filename=rapor.csv")).toBe(
      "rapor.csv",
    );
    expect(
      attachmentFilename(
        "attachment; filename=\"rapor.csv\"; filename*=UTF-8''%E0%A4%A",
      ),
    ).toBe("rapor.csv");
  });

  it("gives nothing for a header that is hidden or names nothing", () => {
    expect(attachmentFilename(undefined)).toBeNull();
    expect(attachmentFilename("attachment")).toBeNull();
    expect(attachmentFilename('attachment; filename=""')).toBeNull();
  });
});
