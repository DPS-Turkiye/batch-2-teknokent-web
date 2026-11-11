# Data fetching and state

## Where data comes from

- **Server components** read the session and call loaders in `src/lib` on the server, then pass the result down as
  props. Use this when a page only needs data at request time.
- **Client components** get data and state only from hooks in `src/hooks`. A hook calls the browser client in
  `src/lib/client`, which calls this app's `/api/*` routes (never the backend directly).

## TanStack Query

The app-wide `QueryClient` (`src/components/providers/query-provider.tsx`) uses `staleTime: 30s`, one retry and no
refetch on window focus. Mutations invalidate what they change; polling refetches on its own schedule.

### Queries

```ts
export const MEETING_PROPOSALS_QUERY_KEY = ["meeting-proposals"] as const;

export function useMyMeetingProposalsQuery() {
  return useQuery({
    queryKey: [...MEETING_PROPOSALS_QUERY_KEY, "mine"],
    queryFn: getMyMeetingProposals,
    ...polling(POLL_INTERVAL.background),
  });
}
```

- Each resource exports its key as a `*_QUERY_KEY` constant from its hook module, and other hooks import that
  constant to invalidate it. Never retype a key as a string literal elsewhere.
- Key factories take their parameters: `mentorshipRequestsQueryKey(role)`, `programWeekPlanQueryKey(programId)`.
- Disable a query whose input is missing with `enabled: Boolean(id)` rather than calling it with a placeholder.
- Poll with `polling(POLL_INTERVAL.chat | messages | background)` from `src/lib/poll.ts`; it slows down while the user
  is idle. TanStack itself does not poll a hidden tab (`refetchIntervalInBackground` is off). For a hand-written
  `setInterval`, wrap the tick in `whenVisible`.

### Mutations

```ts
const decline = useMutation({
  mutationFn: ({ id, text }: { id: string; text: string }) =>
    declineMeetingProposal(id, text),
  onSuccess: () => {
    void queryClient.invalidateQueries({
      queryKey: MEETING_PROPOSALS_QUERY_KEY,
    });
    void queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
  },
});
```

- Invalidate every query whose data the mutation changed. When the response is the new state of the resource, write
  it with `queryClient.setQueryData` instead of refetching.
- A promise you do not await is marked with `void` (lint requires it).
- Report results with `useToast().showToast({ message, tone: ToastTone.Success })`. For failures, show
  `errorMessage(error, t("saveFailed"))`: the backend's message when there is one, a translated fallback otherwise.

## What a hook returns

A hook returns what its view needs and nothing it does not, in view terms:

```ts
return {
  proposals: proposals.data ?? [],
  isLoading: proposals.isLoading,
  accept: (id: string) => accept.mutate(id),
  accepting: accept.isPending ? accept.variables : null,
  decliningId,
  startDecline,
  cancelDecline,
};
```

Prefer named values (`canSave`, `isSaving`, `problem`) over handing the view raw query and mutation objects that
it then has to interpret.

## Forms

- Form state lives in the hook. The hook exposes `update(field, value)` style callbacks, a validation result computed
  by a pure function in `src/lib` (so it is unit-tested), and `save()`.
- Validation messages are message keys, not inline strings.
- Build the request payload in the hook or in `src/lib`, never in the component.

## Editable lists

Rows that the user adds, removes or reorders (past roles, schools, team members, plan weeks, document titles) carry a
React key from `src/lib/keyed-list.ts`:

```ts
// load
experiences: withKeys(profile.experiences.map(toDraft)),
// add
experiences: [...previous.experiences, withKey(EMPTY_EXPERIENCE)],
// save: the key never reaches the backend
experiences: withoutKeys(form.experiences.filter(isFilled)),
```

- Keep the key through edits: when an editor hands back a new value, merge it into the row (`{ ...value, key: row.key }`).
- A list derived from a query on every render must be memoized (`useMemo`) before keys are added, or it gets new keys
  on every render and the rows remount.
- A check that looks at "all fields of the row" must list the fields; `Object.values(row)` would include the key.

## Drafts that survive a reload

The signup and mentor onboarding wizards save their draft to the backend with `useOnboardingDraftSync`
(`src/hooks/use-onboarding-draft-sync.ts`) and restore it on the next visit.

- Save the draft without UI-only data: React keys are stripped (`withoutKeys`), and `File` handles are dropped
  (`stripFileHandles`, `dropDetachedFile` in `src/lib/draft-storage.ts`).
- A restored draft is untrusted data from an older version of the app: merge it over the defaults so new fields get
  their default, and re-key its rows.

## App-wide UI state

`src/stores` holds small zustand stores for state that is truly global: toasts (`useToast`) and the document preview.
Everything else is server state (TanStack Query) or local to a hook. Do not add a store for data that comes from the
backend.
