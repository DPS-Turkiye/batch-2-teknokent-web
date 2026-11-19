import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DELETE as removeLabel,
  PUT as updateLabel,
} from "@/app/api/coordinator/programs/[id]/mentor-labels/[labelId]/route";
import {
  POST as createLabel,
  GET as readBoard,
} from "@/app/api/coordinator/programs/[id]/mentor-labels/route";
import { PUT as setLabels } from "@/app/api/coordinator/programs/[id]/mentors/[mentorId]/labels/route";
import { GET as readDirectory } from "@/app/api/mentor-labels/directory/route";
import { GET as readMentorLabels } from "@/app/api/mentor-labels/mentors/[mentorId]/route";
import { MentorLabelColor } from "@/interfaces/mentor-label";
import { UserRole } from "@/interfaces/session";
import {
  createMentorLabel,
  deleteMentorLabel,
  fetchMentorLabelBoard,
  fetchMentorLabelDirectory,
  fetchMentorProgramLabels,
  setMentorLabels,
  updateMentorLabel,
} from "@/lib/api/mentor-labels";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import { getSessionIds } from "@/lib/session";
import tr from "@/messages/tr.json";
import {
  answerEachWith,
  backendResponse,
  guardRefusal,
} from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/mentor-labels", () => ({
  createMentorLabel: vi.fn(),
  deleteMentorLabel: vi.fn(),
  fetchMentorLabelBoard: vi.fn(),
  fetchMentorLabelDirectory: vi.fn(),
  fetchMentorProgramLabels: vi.fn(),
  setMentorLabels: vi.fn(),
  updateMentorLabel: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getSessionIds: vi.fn() }));

const program = { params: Promise.resolve({ id: "program-1" }) };
const label = {
  params: Promise.resolve({ id: "program-1", labelId: "label-1" }),
};
const mentor = {
  params: Promise.resolve({ id: "program-1", mentorId: "mentor-1" }),
};
const LABEL_A = "00000000-0000-4000-8000-0000000000a1";
const LABEL_B = "00000000-0000-4000-8000-0000000000b1";
const mentorOnly = { params: Promise.resolve({ mentorId: "mentor-1" }) };

function json(body: unknown, method = "POST") {
  return new Request("http://localhost", {
    method,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const BACKEND_CALLS = [
  createMentorLabel,
  deleteMentorLabel,
  fetchMentorLabelBoard,
  fetchMentorLabelDirectory,
  fetchMentorProgramLabels,
  setMentorLabels,
  updateMentorLabel,
];

describe("mentor label routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
      ok: true,
      session: appSession({
        userId: "coordinator-1",
        role: UserRole.Coordinator,
      }),
    });
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "mentee-1",
      organizationId: "org-1",
    });
    answerEachWith(BACKEND_CALLS, backendResponse({}));
  });

  it("edits as the session's coordinator, ignoring a forged actor", async () => {
    await readBoard(new Request("http://localhost"), program);
    await createLabel(
      json({ actorId: "forged", name: " Fintech ", color: "GREEN" }),
      program,
    );
    await updateLabel(
      json({ actorId: "forged", name: "AI", color: "TEAL" }, "PUT"),
      label,
    );
    await removeLabel(new Request("http://localhost"), label);
    await setLabels(
      json({ actorId: "forged", labelIds: [LABEL_A, LABEL_B] }, "PUT"),
      mentor,
    );

    expect(fetchMentorLabelBoard).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
    );
    expect(createMentorLabel).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      { name: "Fintech", color: MentorLabelColor.Green },
    );
    expect(updateMentorLabel).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "label-1",
      { name: "AI", color: MentorLabelColor.Teal },
    );
    expect(deleteMentorLabel).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "label-1",
    );
    expect(setMentorLabels).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "mentor-1",
      [LABEL_A, LABEL_B],
    );
  });

  it("refuses anyone who is not a coordinator or an admin", async () => {
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );

    const statuses = [
      (await readBoard(new Request("http://localhost"), program)).status,
      (await createLabel(json({ name: "AI", color: "BLUE" }), program)).status,
      (await updateLabel(json({ name: "AI", color: "BLUE" }, "PUT"), label))
        .status,
      (await removeLabel(new Request("http://localhost"), label)).status,
      (await setLabels(json({ labelIds: [] }, "PUT"), mentor)).status,
    ];

    expect(statuses).toEqual([403, 403, 403, 403, 403]);
    for (const call of BACKEND_CALLS) expect(call).not.toHaveBeenCalled();
  });

  it.each([
    ["a color outside the palette", { name: "Fintech", color: "#ff0000" }],
    ["no color", { name: "Fintech" }],
    ["a blank name", { name: "   ", color: "BLUE" }],
    ["a name over 30 characters", { name: "a".repeat(31), color: "BLUE" }],
    ["malformed JSON", "{not json"],
  ])("refuses a label with %s", async (_case, body) => {
    expect((await createLabel(json(body), program)).status).toBe(400);
    expect((await updateLabel(json(body, "PUT"), label)).status).toBe(400);
    expect(createMentorLabel).not.toHaveBeenCalled();
    expect(updateMentorLabel).not.toHaveBeenCalled();
  });

  it("tidies a name before checking its length", async () => {
    await createLabel(
      json({
        name: ` ${"a".repeat(15)}\u200B   ${"b".repeat(14)} `,
        color: "BLUE",
      }),
      program,
    );

    expect(createMentorLabel).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      {
        name: `${"a".repeat(15)} ${"b".repeat(14)}`,
        color: MentorLabelColor.Blue,
      },
    );
  });

  it("accepts a name of exactly 30 characters", async () => {
    const name = "a".repeat(30);

    expect(
      (await createLabel(json({ name, color: "BLUE" }), program)).status,
    ).toBe(200);
    expect(createMentorLabel).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      { name, color: MentorLabelColor.Blue },
    );
  });

  it.each([
    [
      "six labels",
      {
        labelIds: Array.from(
          { length: 6 },
          (_, index) => `00000000-0000-4000-8000-00000000000${index}`,
        ),
      },
    ],
    ["no list", {}],
    ["an id that is not a UUID", { labelIds: ["label-1"] }],
  ])("refuses a mentor's labels with %s", async (_case, body) => {
    expect((await setLabels(json(body, "PUT"), mentor)).status).toBe(400);
    expect(setMentorLabels).not.toHaveBeenCalled();
  });

  it("reads the mentee directory and a mentor's labels as the signed-in user", async () => {
    await readDirectory();
    await readMentorLabels(new Request("http://localhost"), mentorOnly);

    expect(fetchMentorLabelDirectory).toHaveBeenCalledWith("mentee-1");
    expect(fetchMentorProgramLabels).toHaveBeenCalledWith(
      "mentee-1",
      "mentor-1",
    );
  });

  it("needs a session to read labels", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "",
      organizationId: "",
    });

    expect((await readDirectory()).status).toBe(401);
    expect(
      (await readMentorLabels(new Request("http://localhost"), mentorOnly))
        .status,
    ).toBe(401);
    expect(fetchMentorLabelDirectory).not.toHaveBeenCalled();
    expect(fetchMentorProgramLabels).not.toHaveBeenCalled();
  });

  it("answers 502 with a translated message when the backend cannot be reached", async () => {
    vi.mocked(fetchMentorLabelBoard).mockRejectedValue(new Error("down"));

    const response = await readBoard(new Request("http://localhost"), program);

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      message: tr.apiErrors.mentorLabelsLoadFailed,
    });
  });
});
