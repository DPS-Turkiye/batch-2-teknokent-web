/**
 * The strings in `value` when it is an array, such as a `t.raw(...)` message list or parsed JSON;
 * anything else gives an empty list.
 */
export function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
