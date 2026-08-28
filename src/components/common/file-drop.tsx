"use client";

import { FileText, Upload, X } from "lucide-react";
import { ChangeEvent, useRef } from "react";

import type { UploadedFile } from "@/interfaces/signup";
import { formatFileSize } from "@/lib/utils";

export function FileDrop({
  file,
  label,
  onChange,
}: {
  file: UploadedFile | null;
  label: string;
  onChange: (file: UploadedFile | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (selected)
      onChange({ name: selected.name, size: selected.size, file: selected });
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
    </div>
  );
}
