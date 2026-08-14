"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { Brand } from "@/components/brand";

type FlowStep = "roles" | "login" | "verifying" | "verified";

type DemoAccount = {
  id: string;
  email: string;
  fullName: string;
  organizationName: string;
  jobTitle: string;
};

interface RoleOption {
  id: string;
  label: string;
  description: string;
}

interface RoleGroup {
  id: string;
  title: string;
  description: string;
  roles: RoleOption[];
}

const roleGroups: RoleGroup[] = [
  {
    id: "management",
    title: "Kurum Yönetimi",
    description:
      "Programları, kullanıcıları ve kurum operasyonlarını yöneten kullanıcılar.",
    roles: [
      {
        id: "admin",
        label: "Admin",
        description:
          "Kurum ayarlarını, kullanıcıları ve sistem yetkilerini yönetin.",
      },
      {
        id: "program-manager",
        label: "Program Yöneticisi",
        description:
          "Programları, katılımcıları ve süreç operasyonlarını takip edin.",
      },
    ],
  },
  {
    id: "mentorship",
    title: "Mentorluk ve Eğitim",
    description:
      "Girişimlere mentorluk veya eğitim desteği sağlayan kullanıcılar.",
    roles: [
      {
        id: "mentor",
        label: "Mentor",
        description:
          "Atandığınız girişimlerle görüşmeler gerçekleştirin, öneri ve aksiyonlar oluşturun.",
      },
      {
        id: "trainer",
        label: "Eğitmen",
        description:
          "Eğitimleri, katılımcıları, materyalleri ve ödevleri yönetin.",
      },
    ],
  },
  {
    id: "startup",
    title: "Girişim Ekibi",
    description:
      "Startup süreçlerini, görevlerini ve ilerlemelerini yöneten ekip üyeleri.",
    roles: [
      {
        id: "startup-owner",
        label: "Startup Yetkilisi",
        description:
          "Startup profilini, ekip üyelerini, destek taleplerini ve program süreçlerini yönetin.",
      },
      {
        id: "mentee",
        label: "Mentee / Ekip Üyesi",
        description:
          "Görevlerinizi, görüşmelerinizi, kayıtlarınızı ve startup ilerlemenizi takip edin.",
      },
    ],
  },
];

function FlowHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-[1180px] items-center px-4 sm:px-6 lg:px-8">
        <Brand />
      </div>
    </header>
  );
}

export function LoginFlow() {
  const [step, setStep] = useState<FlowStep>("roles");
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [email, setEmail] = useState("");
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [loginError, setLoginError] = useState("");

  const selectedRoles = useMemo(
    () =>
      roleGroups.flatMap((group) =>
        group.roles.filter((role) => selectedRoleIds.has(role.id)),
      ),
    [selectedRoleIds],
  );

  useEffect(() => {
    let active = true;
    void fetch("/api/demo-accounts", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (active && Array.isArray(data)) setAccounts(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  function toggleRole(roleId: string) {
    setSelectedRoleIds((current) => {
      const next = new Set(current);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep("verifying");
    setLoginError("");
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Giriş yapılamadı.");
      setStep("verified");
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "Giriş yapılamadı.",
      );
      setStep("login");
    }
  }

  function resetFlow() {
    setStep("roles");
    setOpenGroup(null);
    setSelectedRoleIds(new Set());
    setEmail("");
  }

  const unverifiedRoleId =
    selectedRoleIds.has("mentor") && selectedRoleIds.has("trainer")
      ? "trainer"
      : null;
  const verifiedRoles = selectedRoles.filter(
    (role) => role.id !== unverifiedRoleId,
  );

  return (
    <div className="min-h-screen bg-zinc-100">
      <FlowHeader />

      {step === "roles" ? (
        <main className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              ODTÜ Teknokent
            </p>
            <h1 className="mt-4 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
              Platformda hangi görevlerle yer alıyorsunuz?
            </h1>
            <p className="mt-3 text-xs leading-5 text-zinc-600 sm:text-sm">
              Birden fazla görev seçebilirsiniz. Seçimleriniz hesabınıza
              tanımlanan davet ve yetkilerle doğrulanacaktır.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {roleGroups.map((group) => {
              const selectedCount = group.roles.filter((role) =>
                selectedRoleIds.has(role.id),
              ).length;
              const isOpen = openGroup === group.id;

              return (
                <section
                  key={group.id}
                  className="border border-zinc-300 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setOpenGroup(isOpen ? null : group.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-5 p-4 text-left sm:p-5"
                  >
                    <span>
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {group.title}
                        {selectedCount > 0 ? (
                          <span className="border border-zinc-300 px-2 py-0.5 text-[9px] font-normal text-zinc-500">
                            {selectedCount} seçili
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-[10px] leading-4 text-zinc-500 sm:text-xs">
                        {group.description}
                      </span>
                    </span>
                    <span aria-hidden="true" className="text-lg font-light">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen ? (
                    <div className="grid gap-3 border-t border-zinc-200 p-4 sm:grid-cols-2 sm:p-5">
                      {group.roles.map((role) => {
                        const isSelected = selectedRoleIds.has(role.id);
                        return (
                          <label
                            key={role.id}
                            className={`flex cursor-pointer items-start gap-3 border p-4 ${
                              isSelected
                                ? "border-black bg-zinc-50"
                                : "border-zinc-300 hover:border-zinc-500"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRole(role.id)}
                              className="mt-0.5 size-4 accent-black"
                            />
                            <span>
                              <span className="text-xs font-semibold">
                                {role.label}
                              </span>
                              <span className="mt-1 block text-[10px] leading-4 text-zinc-500">
                                {role.description}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col-reverse items-start justify-between gap-6 border-t border-zinc-300 pt-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] text-zinc-500">
                {selectedRoles.length > 0
                  ? `Seçili: ${selectedRoles.map((role) => role.label).join(", ")}`
                  : "Henüz bir görev seçilmedi."}
              </p>
              <a
                href="#"
                className="mt-3 inline-block text-xs underline underline-offset-4"
              >
                Rolümden emin değilim
              </a>
              <p className="mt-3 max-w-2xl text-[10px] leading-4 text-zinc-500">
                Rol seçimi hesabınıza yeni bir yetki tanımlamaz. Seçimleriniz
                giriş yaptıktan sonra doğrulanacaktır.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep("login")}
              disabled={selectedRoles.length === 0}
              className="w-full shrink-0 border border-black bg-black px-5 py-3 text-xs font-medium text-white disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-300 sm:w-auto"
            >
              {selectedRoles.length || 0} görevle devam et
            </button>
          </div>
        </main>
      ) : null}

      {step === "login" ? (
        <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1180px] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <button
              type="button"
              onClick={() => setStep("roles")}
              className="text-xs underline underline-offset-4"
            >
              ← Görevleri değiştir
            </button>
            <p className="mt-5 border border-zinc-300 bg-zinc-50 px-3 py-2 text-[10px] text-zinc-500">
              {selectedRoles.map((role) => role.label).join(" ve ")} olarak
              giriş yapıyorsunuz
            </p>
            <form
              onSubmit={submitLogin}
              className="mt-4 border border-zinc-300 bg-white p-5 sm:p-7"
            >
              <h1 className="text-2xl font-medium">Hesabınıza giriş yapın</h1>
              <p className="mt-2 text-xs leading-5 text-zinc-600">
                Programa davet edildiğiniz veya hesabınızla ilişkili e-posta
                adresini kullanın.
              </p>
              <div className="mt-5 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Demo mentee hesapları
                </p>
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setEmail(account.email)}
                    className={`w-full border p-3 text-left ${email === account.email ? "border-black bg-zinc-50" : "border-zinc-300"}`}
                  >
                    <strong className="block text-xs">
                      {account.fullName}
                    </strong>
                    <span className="mt-1 block text-[10px] text-zinc-500">
                      {account.organizationName} · {account.jobTitle}
                    </span>
                  </button>
                ))}
              </div>
              <div className="my-5 h-px bg-zinc-200" />
              <label className="block text-xs font-medium" htmlFor="email">
                E-posta adresi
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="ornek@metu.edu.tr"
                className="mt-2 w-full border border-zinc-300 bg-zinc-50 px-3 py-3 text-sm placeholder:text-zinc-400"
              />
              <button
                type="submit"
                disabled={!email.trim()}
                className="mt-3 w-full border border-black bg-black px-4 py-3 text-xs font-medium text-white"
              >
                Devam et
              </button>
              {loginError ? (
                <p className="mt-3 text-xs text-red-700" role="alert">
                  {loginError}
                </p>
              ) : null}
              <a
                href="#"
                className="mt-5 block text-center text-[10px] underline underline-offset-4"
              >
                Davet e-postamı bulamıyorum
              </a>
              <p className="mt-6 border-l border-zinc-300 pl-3 text-[10px] leading-4 text-zinc-500">
                Seçtiğiniz görev ve erişim yetkileriniz giriş yaptıktan sonra
                doğrulanacaktır.
              </p>
            </form>
          </div>
        </main>
      ) : null}

      {step === "verifying" ? (
        <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1180px] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <section
            aria-live="polite"
            aria-busy="true"
            className="w-full max-w-md border border-zinc-300 bg-white p-8 text-center"
          >
            <div
              aria-hidden="true"
              className="mx-auto size-7 animate-spin rounded-full border-2 border-zinc-200 border-t-black"
            />
            <h1 className="mt-6 text-xl font-medium">
              Görevleriniz doğrulanıyor
            </h1>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Hesabınızla ilişkili programları, davetleri ve görevleri kontrol
              ediyoruz.
            </p>
            <div aria-hidden="true" className="mt-8 grid grid-cols-2 gap-6">
              <span className="h-2 bg-zinc-200" />
              <span className="h-2 bg-zinc-200" />
              <span className="h-2 w-2/3 bg-zinc-200" />
              <span className="ml-auto h-2 w-2/3 bg-zinc-200" />
            </div>
          </section>
        </main>
      ) : null}

      {step === "verified" ? (
        <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1180px] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <section className="w-full max-w-md border border-zinc-300 bg-white p-5 sm:p-7">
            <h1 className="text-2xl font-medium">
              {unverifiedRoleId
                ? "Görevlerinizden biri doğrulanamadı"
                : "Görevleriniz doğrulandı"}
            </h1>
            <div className="mt-5 divide-y divide-zinc-200 border border-zinc-200">
              {selectedRoles.map((role) => {
                const isVerified = role.id !== unverifiedRoleId;
                return (
                  <div
                    key={role.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-xs"
                  >
                    <span>{role.label}</span>
                    <span
                      className={isVerified ? "text-zinc-600" : "text-red-700"}
                    >
                      {isVerified ? "✓ Doğrulandı" : "○ Bu hesapla eşleşmedi"}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-5 text-xs leading-5 text-zinc-600">
              {unverifiedRoleId
                ? "Doğrulanan görevinizle devam edebilir veya diğer davetinizi kontrol edebilirsiniz."
                : "Seçtiğiniz görevler hesabınızla eşleşti. Çalışma alanınızı seçerek devam edin."}
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.href = selectedRoleIds.has("mentor")
                  ? "/mentor-dashboard"
                  : "/dashboard";
              }}
              disabled={verifiedRoles.length === 0}
              className="mt-6 w-full border border-black bg-black px-4 py-3 text-xs font-medium text-white disabled:bg-zinc-300"
            >
              {selectedRoleIds.has("mentor")
                ? "Mentor olarak devam et"
                : "Mentee paneline devam et"}
            </button>
            {unverifiedRoleId ? (
              <button
                type="button"
                onClick={() => setStep("login")}
                className="mt-2 w-full border border-zinc-500 px-4 py-3 text-xs font-medium"
              >
                Eğitmen davetimi kontrol et
              </button>
            ) : null}
            <button
              type="button"
              onClick={resetFlow}
              className="mt-4 w-full text-xs underline underline-offset-4"
            >
              Farklı hesapla giriş yap
            </button>
          </section>
        </main>
      ) : null}
    </div>
  );
}
