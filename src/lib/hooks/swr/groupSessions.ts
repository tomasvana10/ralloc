import { GroupSessionData } from "@/db/session";
import { toast } from "sonner";
import useSWR, { SWRConfiguration } from "swr";

export function useGroupSessionsSWR(
  hostId: string,
  options?: Partial<SWRConfiguration>
) {
  const { data, ...rest } = useSWR<GroupSessionData[], Error>(
    `/api/host/${hostId}/sessions`,
    async url => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Your group sessions could not be fetched");
      return (await res.json()).data;
    },
    {
      errorRetryCount: 1,
      fallbackData: [],
      onError: err => {
        toast.error(err.message, {
          id: "group-sessions-swr-err",
          description: "Try reloading the page.",
        });
      },
      ...options,
    }
  );

  return { data: data ?? [], ...rest };
}
