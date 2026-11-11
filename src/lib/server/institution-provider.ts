import "server-only";

import { InstitutionProvider } from "@/interfaces/institution-login";
import { isEnumValue } from "@/lib/enum";

export function toInstitutionProvider(
  value: string,
): InstitutionProvider | null {
  return isEnumValue(InstitutionProvider, value) ? value : null;
}
