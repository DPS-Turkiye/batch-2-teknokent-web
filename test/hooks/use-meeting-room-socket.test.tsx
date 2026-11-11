import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { meetingTodosQueryKey } from "@/hooks/use-meeting-notes";
import {
  RealtimeStatus,
  useMeetingRoomSocket,
} from "@/hooks/use-meeting-room-socket";
import {
  MeetingRoomEventType,
  type MeetingTodo,
} from "@/interfaces/meeting-note";
import { postRealtimeToken } from "@/lib/client/meeting-notes";
import { queryWrapper } from "@test/fixtures/query-wrapper";

type MessageHandler = (message: { body: string }) => void;

/** The callbacks the hook hands the client; it reads none of their arguments. */
type FakeConfig = {
  brokerURL?: string;
  beforeConnect?: () => Promise<void> | void;
  onConnect?: () => void;
  onWebSocketClose?: () => void;
  onStompError?: () => void;
};

/** Stands in for @stomp/stompjs's Client: it records its config and lets a test play the broker. */
const stomp = vi.hoisted(() => {
  class FakeClient {
    static instances: FakeClient[] = [];
    brokerURL: string | undefined;
    connected = false;
    readonly subscriptions = new Map<string, MessageHandler>();
    readonly published: { destination: string; body?: string }[] = [];
    readonly activate = vi.fn();
    readonly deactivate = vi.fn(async () => {});

    constructor(readonly config: FakeConfig) {
      this.brokerURL = config.brokerURL;
      FakeClient.instances.push(this);
    }

    subscribe(destination: string, handler: MessageHandler) {
      this.subscriptions.set(destination, handler);
    }

    publish(params: { destination: string; body?: string }) {
      this.published.push(params);
    }
  }
  return { FakeClient };
});

vi.mock("@stomp/stompjs", () => ({ Client: stomp.FakeClient }));
vi.mock("@/lib/client/meeting-notes", () => ({ postRealtimeToken: vi.fn() }));

const BROKER = "ws://localhost:8080/ws";
const TOPIC = "/topic/meetings/m-1";

function lastClient() {
  const client = stomp.FakeClient.instances.at(-1);
  if (!client) throw new Error("no STOMP client was created");
  return client;
}

/** Runs the broker handshake: the token request, then the connect callback. */
async function connect() {
  const client = lastClient();
  await act(async () => {
    await client.config.beforeConnect?.();
  });
  act(() => {
    client.connected = true;
    client.config.onConnect?.();
  });
  return client;
}

function deliver(client: InstanceType<typeof stomp.FakeClient>, event: object) {
  const handler = client.subscriptions.get(TOPIC);
  if (!handler) throw new Error(`nothing subscribed to ${TOPIC}`);
  act(() => handler({ body: JSON.stringify(event) }));
}

const todo: MeetingTodo = {
  id: "t-1",
  meetingId: "m-1",
  title: "Sunumu gönder",
  done: false,
  displayOrder: 0,
};

describe("useMeetingRoomSocket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stomp.FakeClient.instances = [];
    vi.mocked(postRealtimeToken).mockResolvedValue({
      token: "tok en",
      expiresAt: "2026-09-01T11:00:00Z",
    });
  });

  it("opens no connection and reports offline while disabled", () => {
    const { result } = renderHook(
      () => useMeetingRoomSocket("m-1", false),
      queryWrapper(),
    );

    expect(stomp.FakeClient.instances).toHaveLength(0);
    expect(result.current.status).toBe(RealtimeStatus.Offline);
  });

  it("opens no connection without a meeting", () => {
    const { result } = renderHook(
      () => useMeetingRoomSocket(""),
      queryWrapper(),
    );

    expect(stomp.FakeClient.instances).toHaveLength(0);
    expect(result.current.status).toBe(RealtimeStatus.Offline);
  });

  it("connects with a fresh encoded token and subscribes to the meeting's topic", async () => {
    const { result } = renderHook(
      () => useMeetingRoomSocket("m-1"),
      queryWrapper(),
    );
    const client = lastClient();
    expect(client.activate).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe(RealtimeStatus.Connecting);

    await connect();

    expect(client.brokerURL).toBe(`${BROKER}?token=tok%20en`);
    expect(result.current.status).toBe(RealtimeStatus.Connected);
    expect([...client.subscriptions.keys()]).toEqual([TOPIC]);
  });

  it("goes offline when no realtime token can be issued", async () => {
    vi.mocked(postRealtimeToken).mockRejectedValue(new Error("401"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { result } = renderHook(
      () => useMeetingRoomSocket("m-1"),
      queryWrapper(),
    );
    const client = lastClient();

    await act(async () => {
      await client.config.beforeConnect?.();
    });

    expect(result.current.status).toBe(RealtimeStatus.Offline);
    expect(client.brokerURL).toBe(BROKER);
    expect(consoleError).toHaveBeenCalled();
  });

  it.each([
    ["the socket closes", "onWebSocketClose"],
    ["the broker reports an error", "onStompError"],
  ] as const)("goes offline when %s", async (_case, callback) => {
    const { result } = renderHook(
      () => useMeetingRoomSocket("m-1"),
      queryWrapper(),
    );
    const client = await connect();

    act(() => {
      client.config[callback]?.();
    });

    expect(result.current.status).toBe(RealtimeStatus.Offline);
  });

  it("hands document and presence updates only to their own listeners", async () => {
    const { result } = renderHook(
      () => useMeetingRoomSocket("m-1"),
      queryWrapper(),
    );
    const client = await connect();
    const onDocument = vi.fn();
    const onPresence = vi.fn();
    result.current.subscribeToDocumentUpdates(onDocument);
    result.current.subscribeToPresenceUpdates(onPresence);

    deliver(client, {
      type: MeetingRoomEventType.DocumentUpdated,
      update: "doc-1",
    });
    deliver(client, {
      type: MeetingRoomEventType.PresenceUpdated,
      update: "who-1",
    });

    expect(onDocument.mock.calls).toEqual([["doc-1"]]);
    expect(onPresence.mock.calls).toEqual([["who-1"]]);
  });

  it("ignores update events that carry no update", async () => {
    const { result } = renderHook(
      () => useMeetingRoomSocket("m-1"),
      queryWrapper(),
    );
    const client = await connect();
    const onDocument = vi.fn();
    result.current.subscribeToDocumentUpdates(onDocument);

    deliver(client, { type: MeetingRoomEventType.DocumentUpdated });
    deliver(client, { type: MeetingRoomEventType.DocumentUpdated, update: "" });

    expect(onDocument).not.toHaveBeenCalled();
  });

  it("stops calling a listener once it unsubscribes", async () => {
    const { result } = renderHook(
      () => useMeetingRoomSocket("m-1"),
      queryWrapper(),
    );
    const client = await connect();
    const onDocument = vi.fn();
    const unsubscribe = result.current.subscribeToDocumentUpdates(onDocument);
    const onPresence = vi.fn();
    const unsubscribePresence =
      result.current.subscribeToPresenceUpdates(onPresence);

    unsubscribe();
    unsubscribePresence();
    deliver(client, {
      type: MeetingRoomEventType.DocumentUpdated,
      update: "doc-1",
    });
    deliver(client, {
      type: MeetingRoomEventType.PresenceUpdated,
      update: "who-1",
    });

    expect(onDocument).not.toHaveBeenCalled();
    expect(onPresence).not.toHaveBeenCalled();
  });

  it("puts pushed to-dos straight into the meeting's to-do cache", async () => {
    const { queryClient, wrapper } = queryWrapper();
    renderHook(() => useMeetingRoomSocket("m-1"), { wrapper });
    const client = await connect();

    deliver(client, { type: MeetingRoomEventType.TodosUpdated, todos: [todo] });

    expect(queryClient.getQueryData(meetingTodosQueryKey("m-1"))).toEqual([
      todo,
    ]);
  });

  it("publishes document and presence updates to the meeting once connected", async () => {
    const { result } = renderHook(
      () => useMeetingRoomSocket("m-1"),
      queryWrapper(),
    );
    const client = lastClient();

    result.current.publishDocumentUpdate("early", false);
    expect(client.published).toEqual([]);

    await connect();
    result.current.publishDocumentUpdate("state", true);
    result.current.publishPresenceUpdate("cursor");

    expect(client.published).toEqual([
      {
        destination: "/app/meetings/m-1/document",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ update: "state", fullState: true }),
      },
      {
        destination: "/app/meetings/m-1/presence",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ update: "cursor" }),
      },
    ]);
  });

  it("closes the connection on unmount and publishes nothing afterwards", async () => {
    const { result, unmount } = renderHook(
      () => useMeetingRoomSocket("m-1"),
      queryWrapper(),
    );
    const client = await connect();
    const { publishPresenceUpdate } = result.current;

    unmount();
    publishPresenceUpdate("late");

    expect(client.deactivate).toHaveBeenCalledTimes(1);
    expect(client.published).toEqual([]);
  });

  it("reconnects to the new meeting's room when the meeting changes", async () => {
    const { rerender } = renderHook(
      ({ meetingId }) => useMeetingRoomSocket(meetingId),
      { ...queryWrapper(), initialProps: { meetingId: "m-1" } },
    );
    const first = lastClient();

    rerender({ meetingId: "m-2" });

    await waitFor(() => expect(first.deactivate).toHaveBeenCalledTimes(1));
    expect(stomp.FakeClient.instances).toHaveLength(2);
    const second = lastClient();
    await act(async () => {
      await second.config.beforeConnect?.();
    });
    act(() => {
      second.config.onConnect?.();
    });
    expect([...second.subscriptions.keys()]).toEqual(["/topic/meetings/m-2"]);
  });
});
