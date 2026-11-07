/**
 * Topics for programs whose mentees are individual students (İŞKUR). A student mentor picks from these and a
 * student asks for help with one of them, so the same words meet in matching, which compares words.
 */
export const STUDENT_TOPICS = [
  "Kariyer planlama",
  "Staj",
  "CV & LinkedIn",
  "Mülakat",
  "İş arama & ilk iş",
  "Dersler",
  "Erasmus & yurt dışı",
  "Proje & girişimcilik",
] as const;

/** Which students a student mentor can help; saved where a startup mentor's stages go. */
export const STUDENT_LEVELS = [
  "Hazırlık",
  "1. sınıf",
  "2. sınıf",
  "3. sınıf",
  "4. sınıf",
  "Yüksek lisans",
  "Doktora",
] as const;

const STUDENT_TOPIC_SET = new Set<string>(STUDENT_TOPICS);
const STUDENT_LEVEL_SET = new Set<string>(STUDENT_LEVELS);

export function isStudentTopic(topic: string) {
  return STUDENT_TOPIC_SET.has(topic);
}

export function isStudentLevel(level: string) {
  return STUDENT_LEVEL_SET.has(level);
}
