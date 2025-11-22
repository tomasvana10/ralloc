import type { GroupSessionData } from "@/db/group-session";
import type { useGetGroupSessionsSWR } from "@/lib/hooks/group-session";

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
