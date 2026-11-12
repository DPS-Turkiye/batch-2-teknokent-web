import { describe, expect, it } from "vitest";

import { BackendErrorCode } from "@/interfaces/ai-features";
import { isAiFeatureDisabledError } from "@/lib/ai-features";
import { ClientApiError } from "@/lib/client/api";

describe("isAiFeatureDisabledError", () => {
  it("recognises the backend's refusal of a switched-off AI feature", () => {
    expect(
      isAiFeatureDisabledError(
        new ClientApiError("kapalı", 403, BackendErrorCode.AiFeatureDisabled),
      ),
    ).toBe(true);
  });

  it("does not take a permission refusal or another failure for it", () => {
    expect(isAiFeatureDisabledError(new ClientApiError("yasak", 403))).toBe(
      false,
    );
    expect(
      isAiFeatureDisabledError(new ClientApiError("x", 400, "INVALID_REQUEST")),
    ).toBe(false);
    expect(isAiFeatureDisabledError(new Error("ağ"))).toBe(false);
    expect(isAiFeatureDisabledError(null)).toBe(false);
  });
});
