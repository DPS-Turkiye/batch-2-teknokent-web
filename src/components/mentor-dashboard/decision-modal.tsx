import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import {
  MentorDecisionMode,
  MentorshipRequestMessageType,
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";

type Props = {
  request: MentorshipRequest;
  mode: MentorDecisionMode | null;
  message: string;
  selectedSlots: string[];
  isLoadingSlots: boolean;
  showAvailability: boolean;
  isPending: boolean;
  error: string;
  onModeChange: (mode: MentorDecisionMode) => void;
  onMessageChange: (message: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

const statusLabels: Record<MentorshipRequestStatus, string> = {
  [MentorshipRequestStatus.Accepted]: "Kabul Edildi",
  [MentorshipRequestStatus.CounterProposed]: "Saat Önerildi",
  [MentorshipRequestStatus.Declined]: "Uygun Değil",
  [MentorshipRequestStatus.MoreInfoRequested]: "Ek Bilgi İstendi",
  [MentorshipRequestStatus.Pending]: "Yanıt Bekliyor",
  [MentorshipRequestStatus.Withdrawn]: "Geri Çekildi",
};

const decisionOptions = [
  {
    mode: MentorDecisionMode.Accept,
    title: "✅ Kabul Et",
    detail: "Toplantı planlanacak",
    selected:
      "border-emerald-600 bg-emerald-50 font-bold text-emerald-800 ring-2 ring-emerald-500",
  },
  {
    mode: MentorDecisionMode.AskInfo,
    title: "💬 Ek Bilgi İste",
    detail: "Soru sorulacak",
    selected:
      "border-amber-600 bg-amber-50 font-bold text-amber-800 ring-2 ring-amber-500",
  },
  {
    mode: MentorDecisionMode.Decline,
    title: "❌ Uygun Değil",
    detail: "Gerekçeyle reddet",
    selected:
      "border-red-600 bg-red-50 font-bold text-red-800 ring-2 ring-red-500",
  },
] as const;

function messageLabel(mode: MentorDecisionMode) {
  if (mode === MentorDecisionMode.Accept) return "Kabul Mesajınız (Opsiyonel):";
  if (mode === MentorDecisionMode.AskInfo) {
    return "Girişimciye Sorulacak Soru / İstenecek Detay:";
  }
  return "Red Gerekçesi / Açıklama:";
}

export function MentorDecisionModal(props: Props) {
  const {
    request,
    mode,
    message,
    selectedSlots,
    isLoadingSlots,
    showAvailability,
    isPending,
    error,
    onModeChange,
    onMessageChange,
    onClose,
    onSubmit,
  } = props;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        {showAvailability ? (
          <>
            <div className="border-b border-zinc-100 pb-4">
              <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                ✅ Talep Kabul Edildi
              </span>
              <h2 className="mt-2 text-xl font-bold text-zinc-900">
                Müsaitlik Zaman Dilimi Seçimi
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Girişimciye sunmak istediğiniz uygun zaman dilimlerini teyit
                edin.
              </p>
            </div>
            <div className="my-6 space-y-3">
              <p className="text-xs font-semibold text-zinc-700">
                Sunulan Zaman Dilimleri:
              </p>
              {isLoadingSlots ? (
                <p className="text-xs text-zinc-500">
                  Müsaitlik bilgileri yükleniyor...
                </p>
              ) : selectedSlots.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  Takviminizde önümüzdeki günler için tanımlı bir müsaitlik
                  bulunamadı.
                </p>
              ) : (
                selectedSlots.map((slot) => (
                  <div
                    key={slot}
                    className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-900"
                  >
                    <span className="font-semibold">📅 {slot}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Aktif Slot
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end border-t border-zinc-100 pt-4">
              <PrimaryButton onClick={onClose}>
                Tamamla &amp; Kapat
              </PrimaryButton>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Talep Detayı #{request.id.substring(0, 8)}
                </span>
                <h2 className="mt-1 text-xl font-bold text-zinc-900">
                  {request.organizationName ?? "Girişim"} Destek Talebi
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <div className="my-6 space-y-4 text-xs leading-relaxed text-zinc-700">
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-zinc-50 p-4">
                <div>
                  <span className="text-zinc-400">Destek Alanı:</span>
                  <p className="font-semibold text-zinc-800">
                    {request.supportArea}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400">Mevcut Durum:</span>
                  <p className="font-semibold text-zinc-800">
                    {statusLabels[request.status]}
                  </p>
                </div>
              </div>

              {request.recommendationSnapshot ? (
                <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
                  <p className="font-semibold text-zinc-800">Girişim Profili</p>
                  <div className="grid grid-cols-2 gap-3">
                    {request.recommendationSnapshot.startupSector ? (
                      <div>
                        <span className="text-zinc-400">Sektör:</span>
                        <p className="font-semibold text-zinc-800">
                          {request.recommendationSnapshot.startupSector}
                        </p>
                      </div>
                    ) : null}
                    {request.recommendationSnapshot.startupStage ? (
                      <div>
                        <span className="text-zinc-400">Aşama:</span>
                        <p className="font-semibold text-zinc-800">
                          {request.recommendationSnapshot.startupStage}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  {request.recommendationSnapshot.startupSummary ? (
                    <p className="text-zinc-600">
                      {request.recommendationSnapshot.startupSummary}
                    </p>
                  ) : null}
                  {request.recommendationSnapshot.startupTechnologies.length >
                  0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {request.recommendationSnapshot.startupTechnologies.map(
                        (technology) => (
                          <span
                            key={technology}
                            className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700"
                          >
                            {technology}
                          </span>
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {request.messages.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-semibold text-zinc-800">Mesaj Geçmişi:</p>
                  <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
                    {request.messages.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-lg border p-2 text-xs ${
                          item.messageType ===
                          MentorshipRequestMessageType.MentorQuestion
                            ? "border-amber-200 bg-amber-50 text-amber-900"
                            : "border-blue-200 bg-blue-50 text-blue-900"
                        }`}
                      >
                        <span className="font-bold">
                          {item.messageType ===
                          MentorshipRequestMessageType.MentorQuestion
                            ? "Mentor Sorusu:"
                            : "Girişimci Yanıtı:"}
                        </span>{" "}
                        {item.body}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-3 pt-2">
                <p className="font-bold text-zinc-900">
                  Kararınız / Yanıtınız:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {decisionOptions.map((option) => (
                    <button
                      key={option.mode}
                      type="button"
                      onClick={() => onModeChange(option.mode)}
                      className={`rounded-xl border p-3 text-center transition ${
                        mode === option.mode
                          ? option.selected
                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                      }`}
                    >
                      <span className="block text-sm">{option.title}</span>
                      <span className="text-[10px] text-zinc-500">
                        {option.detail}
                      </span>
                    </button>
                  ))}
                </div>
                {mode ? (
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-semibold text-zinc-700">
                      {messageLabel(mode)}
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(event) => onMessageChange(event.target.value)}
                      placeholder="Mesajınızı buraya yazın..."
                      className="w-full rounded-xl border border-zinc-300 p-3 text-xs focus:border-zinc-900 focus:outline-none"
                    />
                  </div>
                ) : null}
                {error ? (
                  <p role="alert" className="text-xs text-red-700">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4">
              <SecondaryButton onClick={onClose}>Vazgeç</SecondaryButton>
              <PrimaryButton disabled={!mode || isPending} onClick={onSubmit}>
                {isPending ? "Kaydediliyor..." : "Kararı Kaydet & Devam Et →"}
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
