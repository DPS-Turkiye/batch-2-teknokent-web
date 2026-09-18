import { describe, expect, it } from "vitest";

import { contentDispositionHeader } from "@/lib/content-disposition";

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
