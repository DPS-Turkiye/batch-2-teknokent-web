export function formatSlotDateTime(startsAt: string, locale = "tr") {
  const date = new Date(startsAt);
  const datePart = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(date);
  const timePart = new Intl.DateTimeFormat(locale, {
    timeStyle: "short",
  }).format(date);
  return `${datePart}, ${timePart}`;
}

export function formatMeetingShort(startsAt: string, locale = "tr") {
  const date = new Date(startsAt);
  const datePart = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(date);
  const timePart = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${datePart} · ${timePart}`;
}
