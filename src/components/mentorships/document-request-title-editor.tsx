"use client";

import { Plus, X } from "lucide-react";

export function DocumentRequestTitleEditor({
  titles,
  onChange,
  disabled = false,
  showHeading = true,
}: {
  titles: string[];
  onChange: (titles: string[]) => void;
  disabled?: boolean;
  showHeading?: boolean;
}) {
  function updateTitle(index: number, value: string) {
    onChange(titles.map((title, i) => (i === index ? value : title)));
  }

  function removeTitle(index: number) {
    onChange(titles.filter((_, i) => i !== index));
  }

  function addTitle() {
    onChange([...titles, ""]);
  }

  return (
    <div className={showHeading ? "mt-5" : undefined}>
      {showHeading ? (
        <>
          <h3 className="text-base font-medium text-[#22262b]">
            İstenen belgeler
          </h3>
          <p className="mt-1 text-sm text-[#676e78]">
            Mentee’den görüşme öncesi yüklemesini istediğin belgeleri ekle.
          </p>
        </>
      ) : null}
      <div className={showHeading ? "mt-3 space-y-2" : "space-y-2"}>
        {titles.map((title, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              disabled={disabled}
              onChange={(event) => updateTitle(index, event.target.value)}
              placeholder={`${index + 1}. belge adı`}
              maxLength={500}
              className="min-h-10 flex-1 rounded-lg border border-[#d4d8dd] px-3 text-sm text-[#22262b] outline-none focus:border-[#e86f22]"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeTitle(index)}
              aria-label="Belgeyi kaldır"
              className="grid size-9 place-items-center rounded-lg text-[#858c96] hover:bg-[#f1f2f4] hover:text-[#22262b]"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={addTitle}
        className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-[#e86f22]"
      >
        <Plus className="size-3.5" />
        Belge ekle
      </button>
    </div>
  );
}

export function normalizeDocumentTitles(titles: string[]) {
  return titles.map((title) => title.trim()).filter(Boolean);
}
