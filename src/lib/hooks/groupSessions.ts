import { GroupSessionData } from "@/db/session";
import useSWR from "swr";

export function useGroupSessions(hostId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/host/${hostId}/sessions`,
    async url => {
      return await fetch(url)
        .then(res => res.json())
        .then(res => res.data);
    }
  );

  return { sessions: data as GroupSessionData[], error, isLoading, mutate };
}
