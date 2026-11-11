import { expect } from "vitest";

/** A tuple of exactly `N` items of `T`, e.g. `Tuple<HTMLElement, 2>` is `[HTMLElement, HTMLElement]`. */
type Tuple<
  T,
  N extends number,
  Items extends T[] = [],
> = Items["length"] extends N ? Items : Tuple<T, N, [...Items, T]>;

/**
 * Expects the list to have exactly `count` items and narrows it to a tuple of that length, so the test can read
 * `rows[0]` or destructure `const [first, second] = rows` without checking each item for undefined.
 */
export function expectLength<T, N extends number>(
  items: readonly T[],
  count: N,
): asserts items is Tuple<T, N> {
  expect(items).toHaveLength(count);
}

/** The item at `index`, failing the test with a clear message when the list is shorter. */
export function itemAt<T>(items: readonly T[], index: number): T {
  const item = items.at(index);
  if (item === undefined) {
    throw new Error(
      `Expected an item at index ${String(index)}, but the list has ${String(items.length)}`,
    );
  }
  return item;
}
