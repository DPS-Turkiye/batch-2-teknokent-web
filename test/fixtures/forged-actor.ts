/**
 * A request body as a client could send it: the typed input plus an `actorId` field the type does
 * not allow, for checking that a server wrapper always acts as the session user instead.
 */
export function withForgedActor<T extends object>(
  input: T,
  actorId = "someone-else",
): T & { actorId: string } {
  return { ...input, actorId };
}
