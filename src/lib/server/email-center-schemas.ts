import { z } from "zod";

/** The random token of an unsubscribe link, as the backend makes it. */
export const unsubscribeTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{20,100}$/);
