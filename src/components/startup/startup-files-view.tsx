"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  DeleteDocumentDialog,
  FileUploadDialog,
  ShareDocumentDialog,
} from "@/components/startup/startup-file-dialogs";
import {
  StartupPageFrame,
  startupPrimaryActionClass,
} from "@/components/startup/startup-page-frame";
import { useFileUploadForm } from "@/hooks/use-file-upload-form";
import { useOpenDocument } from "@/hooks/use-startup-documents";
import { useStartupFiles } from "@/hooks/use-startup-files";
import type { StartupDocument } from "@/interfaces/startup-document";
import { DOCUMENT_UPLOAD_ACCEPT } from "@/lib/const";
import { StartupFileFilter, StartupFileStatus } from "@/lib/startup-files";
import { formatDayMonth, formatFileSize } from "@/lib/utils";

const chipClass =
  "rounded-full border px-2.5 py-1 text-[11.5px] font-medium leading-[17px]";

const STATUS_TONES: Record<StartupFileStatus, string> = {
  [StartupFileStatus.Sent]: "border-transparent bg-[#fff2ec] text-[#c2410c]",
  [StartupFileStatus.Waiting]: "border-transparent bg-[#f3f4f6] text-[#676e78]",
  [StartupFileStatus.Current]: "border-transparent bg-[#f3f4f6] text-[#676e78]",
  [StartupFileStatus.Reviewed]:
    "border-transparent bg-[#eefaf3] text-[#0f7a4d]",
  [StartupFileStatus.FromMentor]:
    "border-transparent bg-[#f2f8fc] text-[#2b6cb0]",
};

function filterChipClass(filter: StartupFileFilter, selected: boolean) {
  if (selected) return "border-[#f6c9a5] bg-[#fff4ec] text-[#9e4400]";
  if (filter === StartupFileFilter.Pending) {
    return "border-[#f2ddbe] bg-[#fef6ec] text-[#a65a15] hover:border-[#e8c79a]";
  }
  return "border-[#e4e7ea] bg-[#f3f4f6] text-[#676e78] hover:border-[#d4d8dd]";
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
  const t = useTranslations("startupFiles");
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
        aria-label={t("actionsLabel", { name: document.originalFilename })}
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
            {t("view")}
          </button>
          <button
            role="menuitem"
            type="button"
            className={`${item} text-[#515861]`}
            onClick={choose(onShare)}
          >
            {t("share")}
          </button>
          <button
            role="menuitem"
            type="button"
            className={`${item} text-[#c24135]`}
            onClick={choose(onDelete)}
          >
            {t("delete")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function RequestUploadButton({
  title,
  isUploading,
  onFile,
}: {
  title: string;
  isUploading: boolean;
  onFile: (file: File) => void;
}) {
  const t = useTranslations("startupFiles");
  return (
    <label
      className={`inline-flex min-h-8 cursor-pointer items-center rounded-lg border border-[#e86f22] px-3 text-xs font-semibold text-[#c85816] hover:bg-[#fff9f5] ${
        isUploading ? "pointer-events-none opacity-60" : ""
      }`}
    >
      {isUploading ? t("uploading") : t("upload")}
      <input
        type="file"
        accept={DOCUMENT_UPLOAD_ACCEPT}
        aria-label={t("uploadLabel", { title })}
        disabled={isUploading}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </label>
  );
}

export function StartupFilesView() {
  const t = useTranslations("startupFiles");
  const locale = useLocale();
  const files = useStartupFiles();
  const uploadForm = useFileUploadForm();
  const openDocument = useOpenDocument();

  const uploadAction = (
    <button
      type="button"
      onClick={uploadForm.open}
      className={startupPrimaryActionClass}
    >
      {t("uploadFile")}
    </button>
  );

  if (files.isLoading) {
    return (
      <StartupPageFrame action={uploadAction}>
        <p className="py-10 text-sm text-[#858c96]">{t("loading")}</p>
      </StartupPageFrame>
    );
  }
  if (files.error) {
    return (
      <StartupPageFrame action={uploadAction}>
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {files.error.message}
        </p>
      </StartupPageFrame>
    );
  }

  return (
    <StartupPageFrame action={uploadAction}>
      <div className="space-y-6">
        <div
          role="toolbar"
          aria-label={t("filterLabel")}
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
                className={`${chipClass} transition ${filterChipClass(filter, selected)}`}
              >
                {t("filterCount", {
                  label: files.filterLabel(filter),
                  count: files.counts[filter],
                })}
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#e4e7ea] bg-white">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-[#f8f9fa] text-[11px] font-semibold leading-[17px] text-[#858c96]">
              <tr>
                <th scope="col" className="px-5 py-3">
                  {t("columns.file")}
                </th>
                <th scope="col" className="px-2 py-3">
                  {t("columns.source")}
                </th>
                <th scope="col" className="px-2 py-3">
                  {t("columns.related")}
                </th>
                <th scope="col" className="px-2 py-3">
                  {t("columns.date")}
                </th>
                <th scope="col" className="px-2 py-3">
                  {t("columns.status")}
                </th>
                <th scope="col" className="w-12 px-2 py-3">
                  <span className="sr-only">{t("columns.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {files.rows.length === 0 ? (
                <tr className="border-t border-[#eceef0]">
                  <td colSpan={6} className="px-5 py-6 text-sm text-[#858c96]">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                files.rows.map((row) => {
                  const own = row.ownDocument;
                  const pending = row.pendingRequest;
                  const documentId = row.documentId;
                  return (
                    <tr key={row.key} className="border-t border-[#eceef0]">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Image
                            src="/startup/paper.svg"
                            alt=""
                            width={17}
                            height={17}
                          />
                          <div className="min-w-0">
                            {documentId ? (
                              <button
                                type="button"
                                onClick={() => void openDocument(documentId)}
                                className="block max-w-[320px] truncate text-left text-[13px] font-medium leading-5 text-[#22262b] hover:underline"
                              >
                                {row.title}
                              </button>
                            ) : (
                              <span className="block max-w-[320px] truncate text-[13px] font-medium leading-5 text-[#22262b]">
                                {row.title}
                              </span>
                            )}
                            <span className="block text-[11.5px] leading-[17px] text-[#858c96]">
                              {row.sizeBytes != null
                                ? formatFileSize(row.sizeBytes)
                                : t("notUploaded")}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3.5 text-[12.5px] leading-[19px] text-[#4a5059]">
                        {row.source}
                      </td>
                      <td className="px-2 py-3.5 text-[12.5px] leading-[19px] text-[#676e78]">
                        {row.related}
                      </td>
                      <td className="px-2 py-3.5 text-[12.5px] leading-[19px] text-[#676e78]">
                        {formatDayMonth(new Date(row.date), locale)}
                      </td>
                      <td className="px-2 py-3.5">
                        <span
                          className={`${chipClass} ${STATUS_TONES[row.status]}`}
                        >
                          {t(`status.${row.status}`)}
                        </span>
                      </td>
                      <td className="px-2 py-3.5">
                        {own ? (
                          <FileMenu
                            document={own}
                            onDelete={() => files.askDelete(own.id)}
                            onOpen={() => void openDocument(own.id)}
                            onShare={() => files.openShare(own.id)}
                          />
                        ) : null}
                        {pending ? (
                          <RequestUploadButton
                            title={pending.title}
                            isUploading={
                              files.uploadingRequestId === pending.id
                            }
                            onFile={(file) =>
                              files.uploadForRequest(pending, file)
                            }
                          />
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {files.pendingNotice ? (
          <p
            role="status"
            className="flex items-center gap-2.5 rounded-[10px] border border-[#fbe2d0] bg-[#fff4ec] px-4 py-3.5 text-[12.5px] leading-[19px] text-[#4a5059]"
          >
            <Image src="/startup/star-info.svg" alt="" width={16} height={16} />
            {files.pendingNotice}
          </p>
        ) : null}
      </div>

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
    </StartupPageFrame>
  );
}
