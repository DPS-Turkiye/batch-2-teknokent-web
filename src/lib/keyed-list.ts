/*
 * Rows of an editable list (past roles, schools, team members, plan weeks...) carry a key that only React uses. With
 * the row's position as its key, removing or inserting a row hands the next row's DOM, focus and state to another row;
 * a key that stays with the row keeps them where they belong.
 *
 * A row gets its key when it is loaded or added, keeps it through edits, and loses it before the list leaves the
 * browser: the backend and the saved drafts never see it. Keys are only unique within a page load, so a row restored
 * from a saved draft is given a fresh one.
 */

export type Keyed<T extends object> = T & { readonly key: string };

let lastKey = 0;

export function newRowKey(): string {
  lastKey += 1;
  return `row-${lastKey}`;
}

/** The row with a new key, replacing any key it carried. */
export function withKey<T extends object>(row: T): Keyed<T> {
  return { ...row, key: newRowKey() };
}

export function withKeys<T extends object>(rows: readonly T[]): Keyed<T>[] {
  return rows.map(withKey);
}

export function withoutKey<R extends { readonly key: string }>(
  row: R,
): Omit<R, "key"> {
  const { key: _key, ...rest } = row;
  return rest;
}

export function withoutKeys<R extends { readonly key: string }>(
  rows: readonly R[],
): Omit<R, "key">[] {
  return rows.map(withoutKey);
}

/**
 * Keys for a list of texts that is rebuilt from data on every render (chips parsed from one joined string, say). A key
 * is the text plus how many times it has come so far ("1:A", "1:B", "2:A"); the pair is unique even when a text itself
 * looks like a key. Unlike a position, removing one text leaves the keys of the texts before it, and of other texts,
 * as they were.
 */
export function occurrenceKeys(texts: readonly string[]): string[] {
  const seen = new Map<string, number>();
  return texts.map((text) => {
    const count = (seen.get(text) ?? 0) + 1;
    seen.set(text, count);
    return `${count}:${text}`;
  });
}
