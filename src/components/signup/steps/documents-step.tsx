"use client";

import { Check } from "lucide-react";

import { FileDrop } from "@/components/common/file-drop";
import type { SignupWizard } from "@/hooks/use-signup-wizard";
import { STARTUP_DOCUMENTS } from "@/interfaces/signup";

export function DocumentsStep({ wizard }: { wizard: SignupWizard }) {
  const { draft, setDocument, checklist } = wizard;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">
          Dosyalarını Yükle
        </h1>
        <p className="mt-1.5 text-sm text-[#676e78]">
          Koordinatörlerin görebilmesi için startup&apos;ının dosyalarını ekle!
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-5 sm:grid-cols-2">
          {STARTUP_DOCUMENTS.map((document) => (
            <section key={document.kind}>
              <h2 className="text-sm font-semibold">{document.title}</h2>
              <p className="mb-3 mt-1 text-xs leading-relaxed text-[#676e78]">
                {document.description}
              </p>
              <FileDrop
                file={draft.documents[document.kind] ?? null}
                label={`${document.title} için dosya seç`}
                onChange={(file) => setDocument(document.kind, file)}
              />
            </section>
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-[#e4e7ea] bg-white p-2">
          {checklist.map((item) => (
            <div
              key={item.kind}
              className="flex items-center gap-3 border-b border-[#f1f2f4] px-3 py-3.5 last:border-b-0"
            >
              <span
                aria-hidden
                className={`grid size-4 shrink-0 place-items-center rounded border ${
                  item.done
                    ? "border-[#e86f22] bg-[#e86f22] text-white"
                    : "border-[#d6dade] bg-white"
                }`}
              >
                {item.done ? <Check className="size-3" /> : null}
              </span>
              <span
                className={`text-xs ${item.done ? "text-[#22262b]" : "text-[#676e78]"}`}
              >
                {item.label}
              </span>
              <span className="sr-only">
                {item.done ? "yüklendi" : "yüklenmedi"}
              </span>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
