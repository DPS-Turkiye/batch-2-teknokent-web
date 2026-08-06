"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Brand } from "@/components/brand";

const workspaces = [
  {
    id: "metustars",
    title: "METUStars 2026",
    role: "Mentor",
    status: "Aktif",
  },
  {
    id: "dps-egitim",
    title: "DPS Girişimcilik Eğitimi",
    role: "Eğitmen",
    status: "Aktif",
  },
] as const;

export function WorkspacePicker() {
  const router = useRouter();
  const [remember, setRemember] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(
    null,
  );

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-[1180px] items-center px-4 sm:px-6 lg:px-8">
          <Brand />
        </div>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1180px] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <section className="w-full max-w-xl">
          <h1 className="text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            Hangi çalışma alanına geçmek istiyorsunuz?
          </h1>
          <p className="mt-3 text-xs leading-5 text-zinc-600">
            Hesabınız birden fazla program veya görevle ilişkili.
          </p>

          <div className="mt-8 space-y-3">
            {workspaces.map((workspace) => (
              <article
                key={workspace.id}
                className="border border-zinc-300 bg-white p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold">{workspace.title}</h2>
                    <p className="mt-1 text-[10px] text-zinc-500">
                      {workspace.role}
                    </p>
                  </div>
                  <span className="border border-zinc-300 px-2 py-1 text-[9px] text-zinc-500">
                    {workspace.status}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWorkspace(workspace.title);
                    router.push("/dashboard");
                  }}
                  className="mt-4 w-full border border-zinc-600 px-4 py-2.5 text-xs font-medium hover:bg-zinc-50"
                >
                  Çalışma alanına geç
                </button>
              </article>
            ))}
          </div>

          <label className="mt-5 flex cursor-pointer items-center gap-3 text-xs text-zinc-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="size-4 accent-black"
            />
            Sonraki girişte seçtiğim çalışma alanını otomatik aç
          </label>

          {selectedWorkspace ? (
            <p
              aria-live="polite"
              className="mt-6 border border-zinc-300 bg-white p-4 text-xs leading-5"
            >
              <strong>{selectedWorkspace}</strong> seçildi. Çalışma alanınız
              açılıyor.
              {remember ? " Seçiminiz sonraki giriş için hatırlanacak." : ""}
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
