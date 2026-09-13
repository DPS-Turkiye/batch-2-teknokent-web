"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  DeleteDocumentDialog,
  FileUploadDialog,
  ShareDocumentDialog,
} from "@/components/startup/startup-file-dialogs";
import { useFileUploadForm } from "@/hooks/use-file-upload-form";
import { useOpenDocument } from "@/hooks/use-startup-documents";
import { useStartupFiles } from "@/hooks/use-startup-files";
import type { StartupDocument } from "@/interfaces/startup-document";
import {
  fileTypeLabel,
  STARTUP_FILE_FILTER_LABELS,
  StartupFileFilter,
} from "@/lib/startup-files";
import { formatFileSize, formatLongDate, formatShortDate } from "@/lib/utils";

const headingClass = "text-2xl leading-8 text-[#22262b]";
const emptyClass = "text-sm text-[#858c96]";

function FileIcon() {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#fff4ec]">
      <Image src="/startup/file-brand.svg" alt="" width={18} height={18} />
    </span>
  );
}

function FileMenu({
  document,
  onDelete,
  onOpen,
  onShare,
}: {
  document: StartupDocument;
  onDelete: () => void;
  onOpen: () => void;
  onShare: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function close(event: MouseEvent | KeyboardEvent) {
      const leave =
        event instanceof KeyboardEvent
          ? event.key === "Escape"
          : !menuRef.current?.contains(event.target as Node);
      if (leave) setIsOpen(false);
    }
    window.document.addEventListener("mousedown", close);
    window.document.addEventListener("keydown", close);
    return () => {
      window.document.removeEventListener("mousedown", close);
      window.document.removeEventListener("keydown", close);
    };
  }, [isOpen]);
  const item =
    "block w-full rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-[#f8f9fa]";
  const choose = (action: () => void) => () => {
    setIsOpen(false);
    action();
  };
  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`${document.originalFilename} işlemleri`}
        onClick={() => setIsOpen((open) => !open)}
        className="grid size-7 place-items-center rounded-md hover:bg-[#f8f9fa]"
      >
        <Image src="/startup/more.svg" alt="" width={18} height={18} />
      </button>
      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-8 z-10 w-44 rounded-xl border border-[#e4e7ea] bg-white p-1.5 shadow-lg"
        >
          <button
            role="menuitem"
            type="button"
            className={`${item} text-[#515861]`}
            onClick={choose(onOpen)}
          >
            Görüntüle
          </button>
          <button
            role="menuitem"
            type="button"
            className={`${item} text-[#515861]`}
            onClick={choose(onShare)}
          >
            Mentorla paylaş
          </button>
          <button
            role="menuitem"
            type="button"
            className={`${item} text-[#c24135]`}
            onClick={choose(onDelete)}
          >
            Sil
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function StartupFilesView() {
  const files = useStartupFiles();
  const uploadForm = useFileUploadForm();
  const openDocument = useOpenDocument();

  if (files.isLoading) {
    return <p className="py-10 text-sm text-[#858c96]">Dosyalar yükleniyor…</p>;
  }
  if (files.error) {
    return (
      <p
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {files.error.message}
      </p>
    );
  }

  const shows = (section: StartupFileFilter) =>
    files.filter === StartupFileFilter.All || files.filter === section;
  const { meeting, shared, startup } = files.sections;
  const open = (id: string) => () => void openDocument(id);

  return (
    <div className="space-y-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="toolbar"
          aria-label="Dosya filtresi"
          className="flex flex-wrap gap-2"
        >
          {Object.values(StartupFileFilter).map((filter) => {
            const selected = files.filter === filter;
            return (
              <button
                key={filter}
                type="button"
                aria-pressed={selected}
                onClick={() => files.setFilter(filter)}
                className={`rounded-full border bg-white px-4 py-2 text-sm transition ${selected ? "border-[#e86f22] text-[#e86f22]" : "border-[#fff4ec] text-[#858c96] hover:border-[#fbe2d0]"}`}
              >
                {STARTUP_FILE_FILTER_LABELS[filter]}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={uploadForm.open}
          className="flex items-center gap-1.5 rounded-full bg-[#e86f22] px-4 py-2 text-sm text-white hover:bg-[#ce5e19]"
        >
          <Image src="/startup/plus.svg" alt="" width={14} height={14} />
          Dosya Yükle
        </button>
      </div>

      {shows(StartupFileFilter.Profile) ? (
        <section
          aria-labelledby="startup-files-own"
          className="space-y-4 rounded-[24px] bg-[#fff4ec] p-6"
        >
          <h2 id="startup-files-own" className={headingClass}>
            Startup Dosyalarım
          </h2>
          {startup.length === 0 ? (
            <p className={emptyClass}>Henüz bir startup dosyası yüklenmedi.</p>
          ) : (
            <ul className="space-y-3">
              {startup.map((document) => (
                <li
                  key={document.id}
                  className="flex items-center gap-3 rounded-[24px] bg-white px-4 py-3"
                >
                  <FileIcon />
                  <button
                    type="button"
                    onClick={open(document.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-sm text-[#676e78]">
                      {document.originalFilename}
                    </span>
                    <span className="block text-xs text-[#aeb4bc]">
                      {fileTypeLabel(document)} ·{" "}
                      {formatFileSize(document.sizeBytes)} ·{" "}
                      {formatShortDate(document.createdAt)}
                    </span>
                  </button>
                  <FileMenu
                    document={document}
                    onDelete={() => files.askDelete(document.id)}
                    onOpen={open(document.id)}
                    onShare={() => files.openShare(document.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {shows(StartupFileFilter.Mentor) || shows(StartupFileFilter.Meeting) ? (
        <div
          className={`grid gap-6 ${files.filter === StartupFileFilter.All ? "lg:grid-cols-2" : ""}`}
        >
          {shows(StartupFileFilter.Mentor) ? (
            <section
              aria-labelledby="startup-files-shared"
              className="min-w-0 space-y-4 rounded-[24px] border border-[#e4e7ea] p-6"
            >
              <h2 id="startup-files-shared" className={headingClass}>
                Mentorlarla Paylaşılan Dosyalar
              </h2>
              {shared.length === 0 ? (
                <p className={emptyClass}>
                  Henüz mentorlarla paylaşılan bir dosya yok.
                </p>
              ) : (
                <ul className="space-y-3">
                  {shared.map((row) => (
                    <li
                      key={row.key}
                      className="flex items-center gap-3 rounded-[24px] border border-[#e4e7ea] bg-white px-4 py-3"
                    >
                      <FileIcon />
                      <button
                        type="button"
                        onClick={open(row.document.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-sm text-[#676e78]">
                          {row.document.originalFilename}
                        </span>
                        <span className="block text-xs text-[#aeb4bc]">
                          {row.mentorName} · {formatShortDate(row.sharedAt)}
                        </span>
                      </button>
                      <span className="rounded-full border border-[#fbe2d0] px-2.5 py-[3px] text-[11.5px] text-[#858c96]">
                        Paylaşıldı
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {shows(StartupFileFilter.Meeting) ? (
            <section
              aria-labelledby="startup-files-meetings"
              className="min-w-0 space-y-4 rounded-[24px] border border-[#e4e7ea] p-6"
            >
              <h2 id="startup-files-meetings" className={headingClass}>
                Toplantı Dosyaları
              </h2>
              {meeting.length === 0 ? (
                <p className={emptyClass}>Henüz bir toplantı dosyası yok.</p>
              ) : (
                <ul className="space-y-3">
                  {meeting.map((document) => (
                    <li
                      key={document.id}
                      className="flex items-center gap-3 rounded-[24px] border border-[#e4e7ea] bg-white px-4 py-3"
                    >
                      <FileIcon />
                      <button
                        type="button"
                        onClick={open(document.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-sm text-[#676e78]">
                          {document.originalFilename}
                        </span>
                        <span className="block truncate text-xs text-[#aeb4bc]">
                          {document.meetingAgenda ?? "Toplantı"}
                        </span>
                      </button>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-[#e86f22]">
                        <Image
                          src="/startup/calendar-small.svg"
                          alt=""
                          width={16}
                          height={16}
                        />
                        {formatLongDate(
                          document.meetingScheduledAt ?? document.createdAt,
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </div>
      ) : null}

      <FileUploadDialog form={uploadForm} />
      <ShareDocumentDialog
        document={files.sharingDocument}
        isBusy={files.isSharing}
        mentors={files.mentors}
        onClose={files.closeShare}
        onShare={files.shareWith}
        onStopSharing={files.stopSharing}
      />
      <DeleteDocumentDialog
        document={files.deletingDocument}
        isDeleting={files.isDeleting}
        onCancel={files.cancelDelete}
        onConfirm={files.confirmDelete}
      />
    </div>
  );
}
