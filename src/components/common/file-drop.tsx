"use client";

import { FileText, Upload, X } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";

import type { UploadedFile } from "@/interfaces/signup";
import { validateDocumentUploadFile } from "@/lib/file-validation";
import { formatFileSize } from "@/lib/utils";

export function FileDrop({
  file,
  label,
  onChange,
  alreadyStored,
}: {
  file: UploadedFile | null;
  label: string;
  onChange: (file: UploadedFile | null) => void;
  alreadyStored?: { name: string } | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    const validationError = validateDocumentUploadFile(selected);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      onChange(null);
      return;
    }

    setError("");
    onChange({ name: selected.name, size: selected.size, file: selected });
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
              Zaten yüklendi
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 text-[11px] font-medium text-[#c85816] hover:underline"
        >
          Yerine başka bir dosya seç
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          aria-label={label}
          className="hidden"
          onChange={handleChange}
        />
        {error ? (
          <p className="mt-2 text-[11px] text-[#b42318]" role="alert">
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
          onClick={() => onChange(null)}
          aria-label={`${file.name} dosyasını kaldır`}
          className="grid size-7 place-items-center rounded-full text-[#858c96] hover:bg-[#f8f9fa] hover:text-[#22262b]"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-[#d6dade] bg-white px-4 py-6 text-center">
      <Upload className="mx-auto size-5 text-[#858c96]" strokeWidth={1.8} />
      <p className="mt-2 text-xs text-[#676e78]">Dosyayı sürükleyip bırakın</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-3 inline-flex min-h-9 items-center rounded-lg border border-[#e86f22] bg-white px-4 text-xs font-semibold text-[#c85816] transition hover:bg-[#fff9f5]"
      >
        Dosya seç
      </button>
      <p className="mt-3 text-[11px] text-[#858c96]">
        PDF veya DOCX · En fazla 10 MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        aria-label={label}
        className="hidden"
        onChange={handleChange}
      />
      {error ? (
        <p className="mt-2 text-[11px] text-[#b42318]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
