import {
  QueryClient,
  QueryObserver,
  type DefaultError,
  type QueryObserverLoadingErrorResult,
  type QueryObserverLoadingResult,
  type QueryObserverPendingResult,
  type QueryObserverResult,
  type QueryObserverSuccessResult,
  type QueryState,
  type UseMutationResult,
} from "@tanstack/react-query";
import { vi } from "vitest";

/*
 * What useQuery and useMutation hand a component, for tests that mock a hook built on them, e.g.
 * `vi.mocked(useSomething).mockReturnValue(successQuery(data))`.
 *
 * Query results are built by TanStack itself from a seeded cache, so a mocked result carries every
 * field a real one has (including ones TanStack derives or deprecates). Nothing subscribes, so the
 * query never fetches.
 */

const QUERY_KEY = ["mocked-query"];

function observe<TData, TError>(
  state: Partial<QueryState<TData, TError>>,
  enabled = true,
): QueryObserverResult<TData, TError> {
  const client = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, staleTime: Infinity, retry: false },
    },
  });
  client
    .getQueryCache()
    .build<TData, TError, TData>(client, { queryKey: QUERY_KEY })
    .setState(state);
  return new QueryObserver<TData, TError>(client, {
    queryKey: QUERY_KEY,
    enabled,
  }).getCurrentResult();
}

function unexpected(expected: string, result: { status: string }): Error {
  return new Error(`Expected ${expected} query, got status ${result.status}`);
}

/** A query that answered `data`. */
export function successQuery<TData, TError = DefaultError>(
  data: TData,
): QueryObserverSuccessResult<TData, TError> {
  const result = observe<TData, TError>({
    data,
    status: "success",
    dataUpdatedAt: 1,
  });
  if (result.status !== "success" || result.isPlaceholderData) {
    throw unexpected("a loaded", result);
  }
  return result;
}

function isLoadingResult<TData, TError>(
  result: QueryObserverResult<TData, TError>,
): result is QueryObserverLoadingResult<TData, TError> {
  return result.status === "pending" && result.isLoading;
}

/** A query still waiting for its first answer. */
export function loadingQuery<
  TData,
  TError = DefaultError,
>(): QueryObserverLoadingResult<TData, TError> {
  const result = observe<TData, TError>({
    status: "pending",
    fetchStatus: "fetching",
  });
  if (!isLoadingResult(result)) throw unexpected("a loading", result);
  return result;
}

/** What a disabled useQuery returns before it ever ran: no data, not loading. */
export function idleQuery<
  TData,
  TError = DefaultError,
>(): QueryObserverPendingResult<TData, TError> {
  const result = observe<TData, TError>({ status: "pending" }, false);
  if (result.status !== "pending") throw unexpected("an idle", result);
  return result;
}

/** A query whose first fetch failed with `error`. */
export function failedQuery<TData, TError = DefaultError>(
  error: TError,
): QueryObserverLoadingErrorResult<TData, TError> {
  const result = observe<TData, TError>({
    status: "error",
    error,
    errorUpdateCount: 1,
    errorUpdatedAt: 1,
    fetchFailureCount: 1,
    fetchFailureReason: error,
  });
  if (result.status !== "error" || !result.isLoadingError) {
    throw unexpected("a failed", result);
  }
  return result;
}

type MutationActions = "mutate" | "mutateAsync" | "reset";

/** A mutation nobody has started; pass `mutateAsync` (or `mutate`) to watch what a hook sends. */
export function idleMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  actions: Partial<
    Pick<
      UseMutationResult<TData, TError, TVariables, TContext>,
      MutationActions
    >
  > = {},
): UseMutationResult<TData, TError, TVariables, TContext> {
  type Result = UseMutationResult<TData, TError, TVariables, TContext>;
  return {
    context: undefined,
    data: undefined,
    error: null,
    failureCount: 0,
    failureReason: null,
    isError: false,
    isIdle: true,
    isPaused: false,
    isPending: false,
    isSuccess: false,
    status: "idle",
    submittedAt: 0,
    variables: undefined,
    mutate: vi.fn<Result["mutate"]>(),
    mutateAsync: vi.fn<Result["mutateAsync"]>(),
    reset: vi.fn<Result["reset"]>(),
    ...actions,
  };
}

/** A mutation waiting for the server after being sent `variables`. */
export function pendingMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  variables: TVariables,
  actions: Partial<
    Pick<
      UseMutationResult<TData, TError, TVariables, TContext>,
      MutationActions
    >
  > = {},
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { mutate, mutateAsync, reset } = idleMutation<
    TData,
    TError,
    TVariables,
    TContext
  >(actions);
  return {
    context: undefined,
    data: undefined,
    error: null,
    failureCount: 0,
    failureReason: null,
    isError: false,
    isPaused: false,
    isSuccess: false,
    mutate,
    mutateAsync,
    reset,
    isIdle: false,
    isPending: true,
    status: "pending",
    submittedAt: 1,
    variables,
  };
}
