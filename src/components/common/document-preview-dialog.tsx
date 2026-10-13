"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import type { DocumentDownload } from "@/interfaces/startup-document";
import { documentContentPath } from "@/lib/client/startup-documents";

function isImage(contentType: string) {
  return contentType.startsWith("image/");
}

function isPdf(contentType: string, filename: string) {
  return (
    contentType === "application/pdf" || filename.toLowerCase().endsWith(".pdf")
  );
}

function isOffice(contentType: string, filename: string) {
  const name = filename.toLowerCase();
  return (
    contentType.includes("officedocument") ||
    contentType.includes("msword") ||
    contentType.includes("spreadsheet") ||
    name.endsWith(".docx") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".doc") ||
    name.endsWith(".xls")
  );
}

function previewSrc(file: DocumentDownload, objectUrl: string) {
  if (isOffice(file.contentType, file.filename)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`;
  }
  return objectUrl;
}

export function DocumentPreviewDialog({
  file,
  onClose,
}: {
  file: DocumentDownload;
  onClose: () => void;
}) {
  const t = useTranslations("sharedUi");
  const close = useCallback(() => onClose(), [onClose]);
  const fileKey = file.id ?? file.url;
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [previewKey, setPreviewKey] = useState(fileKey);
  if (previewKey !== fileKey) {
    setPreviewKey(fileKey);
    setObjectUrl(null);
    setError(false);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    let cancelled = false;
    let created: string | null = null;

    async function load() {
      const source = file.id ? documentContentPath(file.id) : file.url;
      const response = await fetch(source);
      if (!response.ok) throw new Error("preview failed");
      const blob = await response.blob();
      created = URL.createObjectURL(blob);
      if (cancelled) {
        URL.revokeObjectURL(created);
        return;
      }
      setObjectUrl(created);
    }

    void load().catch(() => {
      if (!cancelled) setError(true);
    });

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [file]);

  const office = isOffice(file.contentType, file.filename);
  const downloadHref =
    objectUrl ?? (file.id ? documentContentPath(file.id) : file.url);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 sm:px-4 sm:py-6"
      role="presentation"
      onClick={close}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-preview-title"
        className="flex h-[100dvh] w-full max-w-none flex-col overflow-hidden bg-white shadow-2xl sm:h-[min(90vh,880px)] sm:max-w-4xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e4e7ea] px-4 py-3 sm:px-5">
          <h2
            id="document-preview-title"
            className="min-w-0 truncate text-sm font-semibold text-[#22262b]"
          >
            {file.filename}
          </h2>
          <div className="flex shrink-0 items-center gap-1">
            <a
              href={downloadHref}
              download={file.filename}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#515861] hover:bg-[#f7f8f9]"
            >
              {t("download")}
            </a>
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#515861] hover:bg-[#f7f8f9]"
            >
              Kapat
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 bg-[#f7f8f9]">
          {error ? (
            <p role="alert" className="p-6 text-sm text-[#676e78]">
              {t("previewFailed")}
            </p>
          ) : office ? (
            <iframe
              title={file.filename}
              src={previewSrc(file, objectUrl ?? file.url)}
              className="h-full w-full border-0 bg-white"
            />
          ) : !objectUrl ? (
            <p className="p-6 text-sm text-[#858c96]">{t("fileLoading")}</p>
          ) : isImage(file.contentType) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={objectUrl}
              alt={file.filename}
              draggable={false}
              className="mx-auto h-full w-full object-contain select-none"
            />
          ) : (
            <object
              data={previewSrc(file, objectUrl)}
              type={
                isPdf(file.contentType, file.filename)
                  ? "application/pdf"
                  : file.contentType
              }
              className="h-full w-full bg-white"
            >
              <iframe
                title={file.filename}
                src={previewSrc(file, objectUrl)}
                className="h-full w-full border-0 bg-white"
              />
            </object>
          )}
        </div>
      </section>
    </div>
  );
}
