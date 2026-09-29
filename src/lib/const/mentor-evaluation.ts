import { OutcomeClarity } from "@/types/mentor-evaluation";

export const MENTOR_EVALUATION_QUESTION_COUNT = 3;

export const MENTOR_EVALUATION_QUALITIES = [
  "Hazırlıklı",
  "Açık iletişim",
  "Net sorular sordu",
  "Geri bildirime açık",
  "Aktif katılım",
  "Odaklı",
  "Yapıcı",
  "Çözüm odaklı",
  "Motivasyonu yüksek",
  "Saygılı",
] as const;

export const OUTCOME_CLARITY_OPTIONS: {
  value: OutcomeClarity;
  label: string;
}[] = [
  { value: OutcomeClarity.Yes, label: "Evet" },
  { value: OutcomeClarity.Partly, label: "Kısmen" },
  { value: OutcomeClarity.No, label: "Hayır" },
];

/** Stored as the second 1–5 rating, so "Kısmen" sits in the middle of the scale. */
export const OUTCOME_CLARITY_RATINGS: Record<OutcomeClarity, number> = {
  [OutcomeClarity.Yes]: 5,
  [OutcomeClarity.Partly]: 3,
  [OutcomeClarity.No]: 1,
};

export const MENTOR_EVALUATION_NOTE_MAX_LENGTH = 255;

export const MENTOR_EVALUATION_LABELS = {
  breadcrumbRoot: "Mentorluklarım",
  breadcrumbPage: "Görüşme değerlendirmesi",
  title: "Bu görüşme nasıl geçti?",
  info: "3 kısa soru · yaklaşık 1 dakika. Bu değerlendirme mentee’yi puanlamak için değil, görüşmenin ne kadar verimli geçtiğini anlamak için kullanılır.",
  preparedness:
    "1. Mentee bugünkü görüşmeye ne kadar hazırlıklı geldi ve girişimin mevcut durumunu ne kadar net aktardı?",
  preparednessLow: "1 — Hiç hazırlıklı değildi",
  preparednessHigh: "5 — Çok hazırlıklı ve netti",
  qualities: "2. Görüşmedeki iletişimi nasıl özetlersiniz?",
  qualitiesHint: "Birden fazla seçebilirsiniz",
  clarity:
    "3. Görüşmenin sonunda ana kararlar ve sonraki adımlar, yapay zeka özetine ihtiyaç duymadan netleşti mi?",
  note: "Bir sonraki görüşmede farklı olmasını istediğiniz bir şey var mı?",
  optional: "(opsiyonel)",
  notePlaceholder:
    "Örn. Bir sonraki görüşmeye kullanıcı testi bulgularıyla gelmelerini istiyorum.",
  submit: "Değerlendirmeyi gönder",
  submitting: "Gönderiliyor…",
  later: "Daha sonra",
  sentTitle: "Değerlendirmeniz alındı.",
  sentBody:
    "Geri bildiriminiz mentörlük deneyiminin ve programın geliştirilmesine yardımcı olur.",
  backToMentorships: "Mentorluklarıma dön",
  home: "Anasayfaya git",
  loading: "Görüşme yükleniyor…",
  notFound: "Görüşme bulunamadı.",
} as const;
