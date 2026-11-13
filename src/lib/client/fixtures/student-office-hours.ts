import type { AppointmentTime } from "@/interfaces/appointment";
import type {
  OfficeHoursAcademician,
  StudentOfficeHoursSlot,
} from "@/interfaces/student-office-hours";

// Sample academicians for the student's Office Hours until a source serves ODTÜ-signed-in students. Nothing here
// is real; the names follow the Figma frames.

function academician(
  id: string,
  fullName: string,
  academicTitle: string,
  department: string,
  faculty: string,
  tags: string[],
): OfficeHoursAcademician {
  return {
    id,
    accountId: null,
    fullName,
    academicTitle,
    department,
    faculty,
    tags,
    about: null,
    topics: [],
    courses: [],
    place: null,
    durationMinutes: 30,
    responseTime: null,
  };
}

export const OFFICE_HOURS_ACADEMICIANS_SAMPLE: OfficeHoursAcademician[] = [
  {
    ...academician(
      "sample-academician-kaya",
      "Ahmet Kaya",
      "Prof. Dr.",
      "Bilgisayar Mühendisliği",
      "Mühendislik Fakültesi",
      ["Yapay Zeka", "Veri Bilimi", "Makine Öğrenmesi"],
    ),
    about:
      "Makine öğrenmesi ve doğal dil işleme üzerine çalışıyorum. Lisans öğrencilerinin araştırma projelerine katılmasını, lisansüstü başvurularını ve staj seçimlerini konuşmaktan memnuniyet duyarım.",
    topics: [
      {
        title: "Araştırma projeleri",
        body: "Lisans araştırma ve bitirme projeleri",
      },
      {
        title: "Lisansüstü başvuru",
        body: "Yüksek lisans ve doktora seçenekleri",
      },
      {
        title: "Ders ve kariyer",
        body: "Seçmeli dersler, staj ve kariyer yönü",
      },
    ],
    courses: [
      { code: "CENG 462", name: "Makine Öğrenmesi" },
      { code: "CENG 499", name: "Bitirme Projesi" },
      { code: "CENG 563", name: "Doğal Dil İşleme (lisansüstü)" },
    ],
    place: "A-312 · çevrimiçi seçeneği var",
    responseTime: "genellikle 1 gün içinde",
  },
  academician(
    "sample-academician-aydin",
    "Zeynep Aydın",
    "Doç. Dr.",
    "Moleküler Biyoloji ve Genetik",
    "Fen Fakültesi",
    ["Biyoinformatik", "Araştırma"],
  ),
  academician(
    "sample-academician-ozturk",
    "Can Öztürk",
    "Dr. Öğr. Üyesi",
    "İktisat",
    "İktisadi ve İdari Bilimler Fakültesi",
    ["Ekonometri", "Kariyer"],
  ),
  academician(
    "sample-academician-arslan",
    "Selin Arslan",
    "Prof. Dr.",
    "Makine Mühendisliği",
    "Mühendislik Fakültesi",
    ["Termodinamik", "Staj"],
  ),
  academician(
    "sample-academician-koc",
    "Murat Koç",
    "Doç. Dr.",
    "Fizik",
    "Fen Fakültesi",
    ["Kuantum", "Lisansüstü"],
  ),
  academician(
    "sample-academician-er",
    "Deniz Er",
    "Dr. Öğr. Üyesi",
    "Mimarlık",
    "Mimarlık Fakültesi",
    ["Tasarım Stüdyosu", "Portfolyo"],
  ),
];

/** Each academician's weekly hours (weekday 1 = Monday), picked by the id so every sample keeps its own week. */
const WEEKLY_PATTERNS: { weekday: number; hour: number; minute: number }[][] = [
  [
    { weekday: 2, hour: 10, minute: 0 },
    { weekday: 2, hour: 10, minute: 30 },
    { weekday: 3, hour: 11, minute: 30 },
    { weekday: 4, hour: 9, minute: 30 },
    { weekday: 4, hour: 10, minute: 0 },
    { weekday: 4, hour: 14, minute: 0 },
    { weekday: 4, hour: 14, minute: 30 },
    { weekday: 4, hour: 15, minute: 0 },
  ],
  [
    { weekday: 1, hour: 13, minute: 0 },
    { weekday: 2, hour: 11, minute: 0 },
    { weekday: 5, hour: 10, minute: 0 },
  ],
  [
    { weekday: 3, hour: 15, minute: 30 },
    { weekday: 3, hour: 16, minute: 0 },
  ],
];

function patternFor(id: string) {
  // The Figma's last card ("Şu anda müsait saat yok") keeps an empty week; the advisor gets the first pattern.
  if (id === "sample-academician-er") return [];
  const index = Math.max(
    OFFICE_HOURS_ACADEMICIANS_SAMPLE.findIndex((item) => item.id === id),
    0,
  );
  return WEEKLY_PATTERNS[index % WEEKLY_PATTERNS.length] ?? [];
}

/**
 * The sample slots of one academician from `from` for `days` days. A slot in the past is not available, and so is
 * one in four by its date (as if another student had it), so the screens show both states. The pick depends on
 * the slot's own day, never on the window asked for, so the list and the booking screen agree.
 */
export function sampleOfficeHoursSlots(
  academicianId: string,
  from: Date,
  days: number,
  durationMinutes: number,
  now: Date,
): StudentOfficeHoursSlot[] {
  const pattern = patternFor(academicianId);
  const slots: StudentOfficeHoursSlot[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const day = new Date(from);
    day.setDate(day.getDate() + offset);
    const weekday = day.getDay();
    pattern
      .filter((entry) => entry.weekday === weekday)
      .forEach((entry, index) => {
        const start = new Date(day);
        start.setHours(entry.hour, entry.minute, 0, 0);
        const end = new Date(start.getTime() + durationMinutes * 60_000);
        const time: AppointmentTime = {
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
        };
        slots.push({
          ...time,
          available: start > now && (day.getDate() + index) % 4 !== 3,
        });
      });
  }
  return slots;
}
