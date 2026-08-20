"use client";

import { useRouter } from "next/navigation";

import { Brand } from "@/components/brand";
import { RoleGroupSection } from "@/components/login/role-group-section";
import { useLoginFlow } from "@/hooks/use-login-flow";
import { useDemoAccounts } from "@/hooks/use-demo-accounts";
import { LoginFlowStep, LoginRoleId } from "@/interfaces/login";

function FlowHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-[1180px] items-center px-4 sm:px-6 lg:px-8">
        <Brand />
      </div>
    </header>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const {
    roleGroups,
    step,
    setStep,
    openGroup,
    setOpenGroup,
    selectedRoleIds,
    email,
    setEmail,
    loginError,
    selectedRoles,
    toggleRole,
    submitLogin,
    resetFlow,
    unverifiedRoleId,
    verifiedRoles,
  } = useLoginFlow();
  const demoAccounts = useDemoAccounts(
    selectedRoleIds.has(LoginRoleId.Mentor) &&
      !selectedRoleIds.has(LoginRoleId.Mentee)
      ? "MENTOR"
      : "MENTEE",
  );

  return (
    <div className="min-h-screen bg-zinc-100">
      <FlowHeader />

      {step === LoginFlowStep.Roles ? (
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
            {roleGroups.map((group) => (
              <RoleGroupSection
                key={group.id}
                group={group}
                isOpen={openGroup === group.id}
                selectedRoleIds={selectedRoleIds}
                onToggleOpen={() =>
                  setOpenGroup(openGroup === group.id ? null : group.id)
                }
                onToggleRole={toggleRole}
              />
            ))}
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
              onClick={() => setStep(LoginFlowStep.Login)}
              disabled={selectedRoles.length === 0}
              className="w-full shrink-0 border border-black bg-black px-5 py-3 text-xs font-medium text-white disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-300 sm:w-auto"
            >
              {selectedRoles.length || 0} görevle devam et
            </button>
          </div>
        </main>
      ) : null}

      {step === LoginFlowStep.Login ? (
        <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1180px] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <button
              type="button"
              onClick={() => setStep(LoginFlowStep.Roles)}
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
              <button
                type="button"
                disabled
                title="ODTÜ SSO entegrasyonu henüz yapılandırılmadı"
                className="mt-6 w-full cursor-not-allowed border border-zinc-300 px-4 py-3 text-xs font-medium text-zinc-400"
              >
                ODTÜ hesabıyla devam et (yakında)
              </button>
              <div className="my-5 flex items-center gap-3 text-[9px] text-zinc-400">
                <span className="h-px flex-1 bg-zinc-200" />
                veya
                <span className="h-px flex-1 bg-zinc-200" />
              </div>
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
              {demoAccounts.data?.length ? (
                <div className="mt-3 border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Demo hesapları
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {demoAccounts.data.map((account) => (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => setEmail(account.email)}
                        className="border border-zinc-300 bg-white px-2 py-1 text-left text-[10px] hover:border-zinc-500"
                      >
                        {account.fullName} · {account.email}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <button
                type="submit"
                className="mt-3 w-full border border-black bg-black px-4 py-3 text-xs font-medium text-white"
              >
                Devam et
              </button>
              {loginError ? (
                <p
                  role="alert"
                  className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                >
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

      {step === LoginFlowStep.Verifying ? (
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

      {step === LoginFlowStep.Verified ? (
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
              onClick={() => router.push("/workspace")}
              disabled={verifiedRoles.length === 0}
              className="mt-6 w-full border border-black bg-black px-4 py-3 text-xs font-medium text-white disabled:bg-zinc-300"
            >
              {selectedRoleIds.has(LoginRoleId.Mentor)
                ? "Mentor olarak devam et"
                : "Doğrulanan görevlerle devam et"}
            </button>
            {unverifiedRoleId ? (
              <button
                type="button"
                onClick={() => setStep(LoginFlowStep.Login)}
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
