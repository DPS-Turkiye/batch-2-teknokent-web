import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { unsubscribeEmail } from "@/lib/api/email-center";
import { getBackendUrl } from "@/lib/const";
import { itemAt } from "@test/fixtures/list-assertions";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));

beforeEach(() => {
  vi.mocked(axios.post)
    .mockReset()
    .mockResolvedValue({ status: 204, data: null, headers: { a: "b" } });
});

describe("email center backend calls", () => {
  it("unsubscribes with the link's token alone, without any credential", async () => {
    const response = await unsubscribeEmail("t");

    const [url, body, config] = itemAt(vi.mocked(axios.post).mock.calls, 0);
    expect(url).toBe(`${getBackendUrl()}/api/email-center/unsubscribe`);
    expect(body).toEqual({ token: "t" });
    expect(config).not.toHaveProperty("auth");
    expect(config).not.toHaveProperty("withCredentials");
    expect(config?.headers).toEqual({
      Accept: "application/json",
      "Accept-Language": "tr",
    });
    expect(response).toEqual({ status: 204, data: null, headers: { a: "b" } });
  });

  it("hands a refusal back instead of throwing", async () => {
    vi.mocked(axios.post).mockResolvedValue({
      status: 400,
      data: { code: "INVALID_TOKEN" },
      headers: {},
    });

    await expect(unsubscribeEmail("t")).resolves.toMatchObject({
      status: 400,
    });
    const config = itemAt(vi.mocked(axios.post).mock.calls, 0)[2];
    expect(config?.validateStatus?.(500)).toBe(true);
  });
});
