export function formatSlotDateTime(startsAt: string) {
  const date = new Date(startsAt);
  const datePart = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("tr-TR", {
    timeStyle: "short",
  }).format(date);
  return `${datePart}, ${timePart}`;
}

export function formatMeetingShort(startsAt: string) {
  const date = new Date(startsAt);
  const datePart = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${datePart} · ${timePart}`;
}
