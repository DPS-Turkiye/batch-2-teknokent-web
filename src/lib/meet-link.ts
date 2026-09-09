export function normalizeMeetLink(value: string) {
  return value.trim();
}

export function meetLinkHref(value: string) {
  const link = normalizeMeetLink(value);
  if (!link) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(link)) return link;
  return `https://${link}`;
}
