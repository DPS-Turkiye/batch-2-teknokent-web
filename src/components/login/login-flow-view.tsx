"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthPage, AuthShell } from "@/components/auth/auth-shell";
import { authFieldClass } from "@/components/auth/auth-field";
import { RoleGroupSection } from "@/components/login/role-group-section";
import { useDemoAccounts } from "@/hooks/use-demo-accounts";
import { useLoginFlow } from "@/hooks/use-login-flow";
import { LoginFlowStep, LoginRoleId } from "@/interfaces/login";
import { UserRole } from "@/interfaces/session";

const primaryButton =
  "h-[46px] w-full rounded-[10px] bg-[#e5701d] px-6 text-sm font-semibold text-white transition hover:bg-[#ce5e19] disabled:cursor-not-allowed disabled:bg-[#c9cdd2]";
const outlineButton =
  "h-[46px] w-full rounded-[10px] border border-[#e8eaed] bg-white px-6 text-sm font-semibold text-[#374151] transition hover:border-[#e5701d] hover:text-[#c85816]";

export function LoginFlowView() {
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
      ? UserRole.Mentor
      : UserRole.Mentee,
  );
  const visibleDemoAccounts = demoAccounts.data ?? [];

  if (step === LoginFlowStep.Roles) {
    return (
      <AuthPage>
        <div className="mx-auto max-w-[760px]">
          <h1 className="text-2xl font-bold leading-9 tracking-tight text-[#111827]">
            METUal&apos;a hoş geldin
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6b7280]">
            Platformda hangi görevlerle yer alıyorsun? Birden fazla görev
            seçebilirsin; seçimlerin hesabına tanımlı davet ve yetkilerle
            doğrulanacak.
          </p>

          <div className="mt-7 space-y-3">
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

          <div className="mt-8 border-t border-[#f3f4f6] pt-6">
            <p className="text-xs text-[#6b7280]">
              {selectedRoles.length > 0
                ? `Seçili: ${selectedRoles.map((role) => role.label).join(", ")}`
                : "Henüz bir görev seçilmedi."}
            </p>
            <div className="mt-5 sm:max-w-xs">
              <button
                type="button"
                onClick={() => setStep(LoginFlowStep.Login)}
                disabled={selectedRoles.length === 0}
                className={primaryButton}
              >
                {selectedRoles.length || 0} görevle devam et
              </button>
            </div>
            <p className="mt-4 max-w-2xl text-xs leading-5 text-[#9ca3af]">
              Rol seçimi hesabına yeni bir yetki tanımlamaz. Seçimlerin giriş
              yaptıktan sonra doğrulanacak.
            </p>
          </div>

          <div className="mt-8 border-t border-[#f3f4f6] pt-7">
            <p className="text-[13px] font-medium text-[#6b7280]">
              METUal&apos;a yeni misin?
            </p>
            <Link
              href="/signup"
              className="mt-4 block max-w-md rounded-xl border-[1.37px] border-[#e8eaed] p-4 transition hover:border-[#e5701d] hover:bg-[#fff9f5]"
            >
              <span className="block text-sm font-semibold text-[#111827]">
                Startup&apos;ımla katıl
              </span>
              <span className="block pt-1 text-xs leading-[18px] text-[#6b7280]">
                Girişimini METUal&apos;a ekle ve mentorluk süreçlerine katıl.
              </span>
            </Link>
          </div>
        </div>
      </AuthPage>
    );
  }

  if (step === LoginFlowStep.Login) {
    return (
      <AuthShell>
        <form onSubmit={submitLogin} className="flex flex-col gap-2 py-6">
          <button
            type="button"
            onClick={() => setStep(LoginFlowStep.Roles)}
            className="self-start text-xs text-[#6b7280] underline underline-offset-4 hover:text-[#111827]"
          >
            ← Görevleri değiştir
          </button>

          <h1 className="pt-5 text-center text-2xl font-bold leading-9 text-[#111827]">
            METUal&apos;a hoş geldin
          </h1>
          <p className="pt-1 text-center text-xs text-[#6b7280]">
            {selectedRoles.map((role) => role.label).join(" ve ")} olarak giriş
            yapıyorsun
          </p>

          <div className="flex flex-col gap-1.5 pt-7">
            <label
              htmlFor="email"
              className="text-[13px] font-semibold text-[#374151]"
            >
              E-posta <span className="text-[#e5701d]">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ornek@metu.edu.tr"
              className={authFieldClass}
            />
          </div>

          {visibleDemoAccounts.length ? (
            <div className="mt-4 rounded-xl border border-[#e8eaed] bg-[#fcfcfd] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                Demo hesapları
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {visibleDemoAccounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setEmail(account.email)}
                    className="rounded-lg border border-[#e8eaed] bg-white px-2.5 py-1.5 text-left text-[11px] text-[#374151] transition hover:border-[#e5701d] hover:text-[#c85816]"
                  >
                    {account.fullName} · {account.email}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="pt-5">
            <button type="submit" className={primaryButton}>
              Giriş yap
            </button>
          </div>

          {loginError ? (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            >
              {loginError}
            </p>
          ) : null}

          <button
            type="button"
            disabled
            title="ODTÜ SSO entegrasyonu henüz yapılandırılmadı"
            className="mt-3 h-[46px] w-full cursor-not-allowed rounded-[10px] border border-[#e8eaed] text-sm font-medium text-[#9ca3af]"
          >
            ODTÜ hesabıyla devam et (yakında)
          </button>

          <div className="mt-7 border-t border-[#f3f4f6] pt-6 text-center">
            <p className="text-[13px] font-medium text-[#6b7280]">
              METUal&apos;a yeni misin?
            </p>
            <Link
              href="/signup"
              className="mt-3 block rounded-xl border-[1.37px] border-[#e8eaed] p-4 text-left transition hover:border-[#e5701d] hover:bg-[#fff9f5]"
            >
              <span className="block text-sm font-semibold text-[#111827]">
                Startup&apos;ımla katıl
              </span>
              <span className="block pt-1 text-xs leading-[18px] text-[#6b7280]">
                Girişimini METUal&apos;a ekle ve mentorluk süreçlerine katıl.
              </span>
            </Link>
          </div>
        </form>
      </AuthShell>
    );
  }

  if (step === LoginFlowStep.Verifying) {
    return (
      <AuthPage>
        <section
          aria-live="polite"
          aria-busy="true"
          className="mx-auto mt-16 w-full max-w-md rounded-2xl border border-[#e8eaed] bg-white p-8 text-center"
        >
          <div
            aria-hidden="true"
            className="mx-auto size-7 animate-spin rounded-full border-2 border-[#f3f4f6] border-t-[#e5701d]"
          />
          <h1 className="mt-6 text-xl font-bold text-[#111827]">
            Görevlerin doğrulanıyor
          </h1>
          <p className="mt-2 text-xs leading-5 text-[#6b7280]">
            Hesabınla ilişkili programları, davetleri ve görevleri kontrol
            ediyoruz.
          </p>
        </section>
      </AuthPage>
    );
  }

  return (
    <AuthPage>
      <section className="mx-auto mt-12 w-full max-w-md rounded-2xl border border-[#e8eaed] bg-white p-6 sm:p-7">
        <h1 className="text-xl font-bold text-[#111827]">
          {unverifiedRoleId
            ? "Görevlerinden biri doğrulanamadı"
            : "Görevlerin doğrulandı"}
        </h1>
        <div className="mt-5 divide-y divide-[#f3f4f6] rounded-xl border border-[#e8eaed]">
          {selectedRoles.map((role) => {
            const isVerified = role.id !== unverifiedRoleId;
            return (
              <div
                key={role.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-xs"
              >
                <span className="text-[#374151]">{role.label}</span>
                <span
                  className={
                    isVerified ? "text-[#e5701d]" : "font-medium text-red-700"
                  }
                >
                  {isVerified ? "✓ Doğrulandı" : "○ Bu hesapla eşleşmedi"}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-xs leading-5 text-[#6b7280]">
          {unverifiedRoleId
            ? "Doğrulanan görevinle devam edebilir veya diğer davetini kontrol edebilirsin."
            : "Seçtiğin görevler hesabınla eşleşti. Çalışma alanını seçerek devam et."}
        </p>
        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={() => router.push("/workspace")}
            disabled={verifiedRoles.length === 0}
            className={primaryButton}
          >
            {selectedRoleIds.has(LoginRoleId.Mentor)
              ? "Mentor olarak devam et"
              : "Doğrulanan görevlerle devam et"}
          </button>
          {unverifiedRoleId ? (
            <button
              type="button"
              onClick={() => setStep(LoginFlowStep.Login)}
              className={outlineButton}
            >
              Eğitmen davetimi kontrol et
            </button>
          ) : null}
          <button
            type="button"
            onClick={resetFlow}
            className="w-full pt-2 text-xs text-[#6b7280] underline underline-offset-4 hover:text-[#111827]"
          >
            Farklı hesapla giriş yap
          </button>
        </div>
      </section>
    </AuthPage>
  );
}
