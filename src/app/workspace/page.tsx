"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Brand } from "@/components/brand";
import { useDemoSession } from "@/components/providers/session-provider";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { UserRole } from "@/interfaces/session";

export default function WorkspacePage() {
  const router = useRouter();
  const session = useDemoSession();
  const [remember, setRemember] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(
    null,
  );
  const isMentor = session?.role === UserRole.Mentor;
  const homeHref = isMentor ? "/mentor-dashboard" : "/dashboard";
  const workspaceTitle = isMentor
    ? (session?.fullName ?? "Mentor")
    : (session?.organizationName ?? "");
  const workspaceRole = isMentor ? "Mentor" : "Girişim Ekibi";

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
            Çalışma alanınıza devam edin
          </h1>
          <p className="mt-3 text-xs leading-5 text-zinc-600">
            Aşağıdaki çalışma alanına geçerek devam edebilirsiniz.
          </p>

          <div className="mt-8 space-y-3">
            {session ? (
              <WorkspaceCard
                title={workspaceTitle}
                role={workspaceRole}
                status="Aktif"
                onSelect={() => {
                  setSelectedWorkspace(workspaceTitle);
                  router.push(homeHref);
                }}
              />
            ) : null}
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
