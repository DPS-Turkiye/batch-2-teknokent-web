/**
 * Narrows an untrusted value (JSON, a URL, storage, a form field) to one of the known values, so the code
 * past this check can compare it to the enum directly.
 */
export function isOneOf<T>(values: readonly T[], value: unknown): value is T {
  const known: readonly unknown[] = values;
  return known.includes(value);
}

/** isOneOf for every member of a string enum, or of a const object of enum members. */
export function isEnumValue<T extends Record<string, string>>(
  enumObject: T,
  value: unknown,
): value is T[keyof T] {
  return isOneOf(Object.values(enumObject), value);
}
