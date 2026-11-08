/**
 * Client wrappers of screens whose backend does not exist yet answer through this, so the
 * hooks and pages already see the real call's shape: a promise, and a fresh copy each time so
 * a screen can never mutate the fixture. Swapping to the real API replaces only the wrapper's
 * body; every fixture lives in this folder.
 */
export function fixtureResponse<T>(data: T): Promise<T> {
  return Promise.resolve(structuredClone(data));
}
