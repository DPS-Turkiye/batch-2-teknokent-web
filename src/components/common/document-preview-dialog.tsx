"use client";

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
  if (isPdf(file.contentType, file.filename)) {
    return `${objectUrl}#toolbar=0&navpanes=0`;
  }
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

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 py-6"
      role="presentation"
      onClick={close}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-preview-title"
        className="flex h-[min(90vh,880px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.preventDefault()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e4e7ea] px-5 py-3">
          <h2
            id="document-preview-title"
            className="min-w-0 truncate text-sm font-semibold text-[#22262b]"
          >
            {file.filename}
          </h2>
          <button
            type="button"
            onClick={close}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#515861] hover:bg-[#f7f8f9]"
          >
            Kapat
          </button>
        </header>
        <div className="min-h-0 flex-1 bg-[#f7f8f9]">
          {error ? (
            <p role="alert" className="p-6 text-sm text-[#676e78]">
              Dosya önizlenemedi.
            </p>
          ) : office ? (
            <iframe
              title={file.filename}
              src={previewSrc(file, objectUrl ?? file.url)}
              className="h-full w-full border-0 bg-white"
            />
          ) : !objectUrl ? (
            <p className="p-6 text-sm text-[#858c96]">Dosya yükleniyor…</p>
          ) : isImage(file.contentType) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={objectUrl}
              alt={file.filename}
              draggable={false}
              className="mx-auto h-full w-full object-contain select-none"
            />
          ) : (
            <iframe
              title={file.filename}
              src={previewSrc(file, objectUrl)}
              className="h-full w-full border-0 bg-white"
            />
          )}
        </div>
      </section>
    </div>
  );
}
