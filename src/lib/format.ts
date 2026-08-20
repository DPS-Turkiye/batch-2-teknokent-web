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
