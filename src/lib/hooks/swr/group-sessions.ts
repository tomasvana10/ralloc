import type { GroupSessionData } from "@/db/session";
import useSWRMutation from "swr/mutation";
import useSWR, { type SWRConfiguration } from "swr";
import type { SessionCreateSchemaType } from "@/components/forms/session-create";
import type z from "zod";

export function useGetGroupSessionsSWR(
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
      ...options,
    }
  );

  return { data: data ?? [], ...rest };
}

export function useCreateGroupSessionSWR() {
  return useSWRMutation(
    "/api/sessions",
    async (
      url: string,
      { arg }: { arg: z.output<SessionCreateSchemaType> }
    ) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message ?? "Unknown error");
      }

      return res.json();
    }
  );
}
