"use client";

import { useTranslations } from "next-intl";
import { FileText, Upload, X } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";

import type { UploadedFile } from "@/interfaces/signup";
import { DOCUMENT_MAX_BYTES } from "@/lib/const";
import { formatFileSize } from "@/lib/utils";

export function FileDrop({
  file,
  label,
  onChange,
  alreadyStored,
  accept = ".pdf,.docx",
  helpText,
  maxBytes = DOCUMENT_MAX_BYTES,
}: {
  file: UploadedFile | null;
  label: string;
  onChange: (file: UploadedFile | null) => void;
  alreadyStored?: { name: string } | null;
  accept?: string;
  helpText: string;
  maxBytes?: number;
}) {
  const t = useTranslations("sharedUi");
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function takeFile(selected: File | undefined) {
    if (!selected) return;
    if (selected.size > maxBytes) {
      setError(t("tooBig", { max: formatFileSize(maxBytes) }));
      return;
    }

    setError(null);
    onChange({ name: selected.name, size: selected.size, file: selected });
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    takeFile(event.target.files?.[0]);
    event.target.value = "";
  }

  if (!file && alreadyStored) {
    return (
      <div>
        <div className="flex items-center gap-3 rounded-xl border border-[#e4e7ea] bg-[#f8f9fa] px-3 py-2.5">
          <FileText className="size-5 shrink-0 text-[#676e78]" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium text-[#22262b]">
              {alreadyStored.name}
            </span>
            <span className="block text-[11px] text-[#858c96]">
              {t("alreadyUploaded")}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 text-[11px] font-medium text-[#c85816] hover:underline"
        >
          {t("chooseAnother")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          aria-label={label}
          className="hidden"
          onChange={handleChange}
        />
        {error ? (
          <p role="alert" className="mt-2 text-[11px] text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[#e86f22] bg-white px-3 py-2.5">
        <FileText className="size-5 shrink-0 text-[#676e78]" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-[#22262b]">
            {file.name}
          </span>
          <span className="block text-[11px] text-[#858c96]">
            {formatFileSize(file.size)}
          </span>
        </span>
        <button
          type="button"
          onClick={() => {
            setError(null);
            onChange(null);
          }}
          aria-label={t("removeFile", { name: file.name })}
          className="grid size-7 place-items-center rounded-full text-[#858c96] hover:bg-[#f8f9fa] hover:text-[#22262b]"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        takeFile(event.dataTransfer.files?.[0]);
      }}
      className="rounded-xl border border-dashed border-[#d6dade] bg-white px-4 py-6 text-center"
    >
      <Upload className="mx-auto size-5 text-[#858c96]" strokeWidth={1.8} />
      <p className="mt-2 text-xs text-[#676e78]">{t("dragDrop")}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-3 inline-flex min-h-9 items-center rounded-lg border border-[#e86f22] bg-white px-4 text-xs font-semibold text-[#c85816] transition hover:bg-[#fff9f5]"
      >
        {t("chooseFile")}
      </button>
      <p className="mt-3 text-[11px] text-[#858c96]">{helpText}</p>
      {error ? (
        <p role="alert" className="mt-2 text-[11px] text-red-600">
          {error}
        </p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        aria-label={label}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
