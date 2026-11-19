import { describe, expect, it } from "vitest";

import { DocumentKind } from "@/interfaces/startup-document";
import {
  ONBOARDING_UPLOAD_RULES,
  uploadAccept,
  uploadProblem,
  uploadTypesLabel,
} from "@/lib/upload-rules";
import { UploadProblem } from "@/types/upload";

const MB = 1024 * 1024;
const PDF = "application/pdf";
const DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PPTX =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

const cv = ONBOARDING_UPLOAD_RULES[DocumentKind.Cv];
const mvp = ONBOARDING_UPLOAD_RULES[DocumentKind.Mvp];
const logo = ONBOARDING_UPLOAD_RULES[DocumentKind.Logo];

function picked(name: string, type: string, size = 1000) {
  return { name, type, size };
}

describe("ONBOARDING_UPLOAD_RULES", () => {
  it("uses the backend's DocumentKind limits: 25 MB for documents, 5 MB for images", () => {
    expect(
      [
        DocumentKind.Cv,
        DocumentKind.Canvas,
        DocumentKind.PitchDeck,
        DocumentKind.Mvp,
      ].map((kind) => ONBOARDING_UPLOAD_RULES[kind].maxBytes),
    ).toEqual([25 * MB, 25 * MB, 25 * MB, 25 * MB]);
    expect(ONBOARDING_UPLOAD_RULES[DocumentKind.Logo].maxBytes).toBe(5 * MB);
    expect(ONBOARDING_UPLOAD_RULES[DocumentKind.Avatar].maxBytes).toBe(5 * MB);
  });

  it("takes the same image formats for a mentor photo as for a logo", () => {
    const avatar = ONBOARDING_UPLOAD_RULES[DocumentKind.Avatar];

    expect(uploadProblem(picked("me.jpg", "image/jpeg"), avatar)).toBeNull();
    expect(uploadProblem(picked("me.heic", "image/heic"), avatar)).toBe(
      UploadProblem.WrongType,
    );
  });
});

describe("uploadProblem", () => {
  it("accepts a PDF or DOCX CV the browser typed correctly", () => {
    expect(uploadProblem(picked("cv.pdf", PDF), cv)).toBeNull();
    expect(uploadProblem(picked("cv.docx", DOCX), cv)).toBeNull();
  });

  it("reads the extension case-insensitively", () => {
    expect(uploadProblem(picked("CV.PDF", "APPLICATION/PDF"), cv)).toBeNull();
  });

  it("reads the extension after the last dot, as the backend does", () => {
    expect(uploadProblem(picked("my.cv.final.PDF", PDF), cv)).toBeNull();
    expect(uploadProblem(picked("cv.pdf.exe", ""), cv)).toBe(
      UploadProblem.WrongType,
    );
    expect(uploadProblem(picked("cv.", ""), cv)).toBe(UploadProblem.WrongType);
  });

  it("accepts a file the browser sent without a type, as the backend does", () => {
    expect(uploadProblem(picked("deck.pptx", ""), mvp)).toBeNull();
    expect(
      uploadProblem(picked("deck.pptx", "application/octet-stream"), mvp),
    ).toBeNull();
  });

  it("refuses an extension the field does not take", () => {
    expect(uploadProblem(picked("cv.pptx", PPTX), cv)).toBe(
      UploadProblem.WrongType,
    );
    expect(uploadProblem(picked("cv", ""), cv)).toBe(UploadProblem.WrongType);
  });

  it("refuses a file whose type does not match its extension", () => {
    expect(uploadProblem(picked("cv.pdf", "image/png"), cv)).toBe(
      UploadProblem.WrongType,
    );
  });

  it("points an MVP video to the link field", () => {
    expect(uploadProblem(picked("demo.avi", "video/x-msvideo"), mvp)).toBe(
      UploadProblem.VideoAsLink,
    );
    expect(uploadProblem(picked("demo.mov", ""), mvp)).toBe(
      UploadProblem.VideoAsLink,
    );
    expect(uploadProblem(picked("demo", "video/mp4"), mvp)).toBe(
      UploadProblem.VideoAsLink,
    );
  });

  it("treats a video as a plain wrong type where there is no link field", () => {
    expect(uploadProblem(picked("demo.mp4", "video/mp4"), cv)).toBe(
      UploadProblem.WrongType,
    );
  });

  it("refuses an empty file", () => {
    expect(uploadProblem(picked("cv.pdf", PDF, 0), cv)).toBe(
      UploadProblem.Empty,
    );
  });

  it("takes a file at the limit and refuses one byte over", () => {
    expect(uploadProblem(picked("cv.pdf", PDF, 25 * MB), cv)).toBeNull();
    expect(uploadProblem(picked("cv.pdf", PDF, 25 * MB + 1), cv)).toBe(
      UploadProblem.TooLarge,
    );
  });

  it("checks the type before the size, so a large video is told to use a link", () => {
    expect(uploadProblem(picked("demo.avi", "", 300 * MB), mvp)).toBe(
      UploadProblem.VideoAsLink,
    );
  });

  it("takes PNG, JPG and WEBP logos up to 5 MB", () => {
    expect(uploadProblem(picked("logo.png", "image/png"), logo)).toBeNull();
    expect(uploadProblem(picked("logo.jpeg", "image/jpeg"), logo)).toBeNull();
    expect(uploadProblem(picked("logo.webp", "image/webp"), logo)).toBeNull();
    expect(uploadProblem(picked("logo.gif", "image/gif"), logo)).toBe(
      UploadProblem.WrongType,
    );
    expect(
      uploadProblem(picked("logo.png", "image/png", 5 * MB + 1), logo),
    ).toBe(UploadProblem.TooLarge);
  });
});

describe("uploadAccept", () => {
  it("lists the extensions and MIME types for the picker", () => {
    expect(uploadAccept(cv)).toBe(`.pdf,${PDF},.docx,${DOCX}`);
    expect(uploadAccept(logo)).toBe(
      ".png,image/png,.jpg,.jpeg,image/jpeg,.webp,image/webp",
    );
  });
});

describe("uploadTypesLabel", () => {
  it("joins the formats with 'veya' in Turkish and 'or' in English", () => {
    expect(uploadTypesLabel(cv, "tr")).toBe("PDF veya DOCX");
    expect(uploadTypesLabel(mvp, "tr")).toBe("PDF, DOCX veya PPTX");
    expect(uploadTypesLabel(cv, "en")).toBe("PDF or DOCX");
  });
});
