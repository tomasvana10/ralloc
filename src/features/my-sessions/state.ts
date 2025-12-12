import type { GroupSessionData } from "@/db/group-session";
import type { useGetGroupSessionsSWR } from "@/hooks/group-session-swr";

export type SelectedSessionsState = Set<string>;

export type SelectedSessionsAction =
  | { type: "add"; payload: string }
  | { type: "remove"; payload: string }
  | { type: "set"; payload: string[] }
  | { type: "clear" };

export function selectedSessionsReducer(
  state: SelectedSessionsState,
  action: SelectedSessionsAction,
): SelectedSessionsState {
  switch (action.type) {
    case "add":
      return new Set([...state, action.payload]);
    case "set":
      return new Set(action.payload);
    case "remove": {
      const next = new Set(state);
      next.delete(action.payload);
      return next;
    }
    case "clear":
      return new Set();
    default:
      return state;
  }
}

export function optimisticallyUpdateSessions(
  original: GroupSessionData,
  changed: Partial<GroupSessionData>,
  getter: ReturnType<typeof useGetGroupSessionsSWR>,
) {
  getter.mutate(
    (prev) =>
      prev?.map((session) =>
        session.code === original.code ? { ...session, ...changed } : session,
      ) ?? [],
    { revalidate: false },
  );
}
