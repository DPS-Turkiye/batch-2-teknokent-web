/**
 * The request fields a validation 400 named, top level and once each, in the backend's order:
 * `teamMembers[0].email` counts as `teamMembers`.
 */
export function invalidFieldNames(fieldErrors: Record<string, string>) {
  const names = Object.keys(fieldErrors)
    .map((path) => path.split(/[.[]/, 1)[0] ?? "")
    .filter(Boolean);
  return [...new Set(names)];
}
