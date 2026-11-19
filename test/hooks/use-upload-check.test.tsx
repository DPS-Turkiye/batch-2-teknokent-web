import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { useUploadCheck } from "@/hooks/use-upload-check";
import { DocumentKind } from "@/interfaces/startup-document";
import type { OnboardingUploadKind } from "@/lib/upload-rules";
import { InLocale } from "@test/test-utils";

const MB = 1024 * 1024;

function renderCheck(kind: OnboardingUploadKind, locale: "tr" | "en" = "tr") {
  return renderHook(() => useUploadCheck(kind), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <InLocale locale={locale}>{children}</InLocale>
    ),
  });
}

function sized(file: File, size: number) {
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("useUploadCheck", () => {
  it("gives the field its hint and picker filter", () => {
    const { result } = renderCheck(DocumentKind.PitchDeck);

    expect(result.current.hint).toBe("PDF veya PPTX · en fazla 25 MB");
    expect(result.current.accept).toContain(".pptx");
    expect(result.current.error).toBeNull();
  });

  it("hands back an accepted file as a draft upload", () => {
    const { result } = renderCheck(DocumentKind.Cv);
    const file = new File(["cv"], "cv.pdf", { type: "application/pdf" });

    let taken: ReturnType<typeof result.current.take> = null;
    act(() => {
      taken = result.current.take(file);
    });

    expect(taken).toEqual({ name: "cv.pdf", size: file.size, file });
    expect(result.current.error).toBeNull();
  });

  it("names the accepted formats when the type is wrong", () => {
    const { result } = renderCheck(DocumentKind.Cv);

    let taken: ReturnType<typeof result.current.take> = null;
    act(() => {
      taken = result.current.take(
        new File(["x"], "cv.pages", { type: "application/x-iwork-pages" }),
      );
    });

    expect(taken).toBeNull();
    expect(result.current.error).toBe(
      "Bu dosya türü desteklenmiyor. PDF veya DOCX yükleyin.",
    );
  });

  it("tells the MVP video uploader to add a link instead", () => {
    const { result } = renderCheck(DocumentKind.Mvp);

    act(() => {
      result.current.take(
        new File(["x"], "demo.avi", { type: "video/x-msvideo" }),
      );
    });

    expect(result.current.error).toBe(
      "Video dosyası yüklenemiyor. Videonuzu YouTube veya Google Drive’a yükleyip bağlantısını Bağlantı alanına ekleyin. Buraya PDF, DOCX veya PPTX yükleyebilirsiniz.",
    );
  });

  it("gives the limit when the file is too large", () => {
    const { result } = renderCheck(DocumentKind.Logo);

    act(() => {
      result.current.take(
        sized(new File(["x"], "logo.png", { type: "image/png" }), 6 * MB),
      );
    });

    expect(result.current.error).toBe("Dosya çok büyük (en fazla 5 MB).");
  });

  it("refuses an empty file", () => {
    const { result } = renderCheck(DocumentKind.Cv);

    act(() => {
      result.current.take(new File([], "cv.pdf", { type: "application/pdf" }));
    });

    expect(result.current.error).toBe("Bu dosya boş. Başka bir dosya seçin.");
  });

  it("clears the refusal once a good file is picked", () => {
    const { result } = renderCheck(DocumentKind.Cv);

    act(() => {
      result.current.take(new File(["x"], "cv.avi", { type: "video/avi" }));
    });
    act(() => {
      result.current.take(
        new File(["cv"], "cv.pdf", { type: "application/pdf" }),
      );
    });

    expect(result.current.error).toBeNull();
  });

  it("ignores a cancelled pick", () => {
    const { result } = renderCheck(DocumentKind.Cv);

    let taken: ReturnType<typeof result.current.take> = null;
    act(() => {
      taken = result.current.take(undefined);
    });

    expect(taken).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("reads in English", () => {
    const { result } = renderCheck(DocumentKind.Canvas, "en");

    act(() => {
      result.current.take(
        sized(
          new File(["x"], "canvas.pdf", { type: "application/pdf" }),
          30 * MB,
        ),
      );
    });

    expect(result.current.hint).toBe("PDF or DOCX · up to 25 MB");
    expect(result.current.error).toBe("The file is too large (up to 25 MB).");
  });
});
