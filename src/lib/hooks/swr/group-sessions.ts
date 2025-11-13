import useSWR, { type SWRConfiguration } from "swr";
import useSWRMutation, { type SWRMutationConfiguration } from "swr/mutation";
import type z from "zod";
import type { GroupSessionData } from "@/db/session";
import type { SessionCreateSchemaType } from "@/forms/session-create";

function throwIfUnauthorised(res: Response) {
  if (res.url.includes("/signin"))
    throw new Error("You are unauthenticated. Please reload the page.");
}

export function useGetGroupSessionsSWR(
  hostId: string,
  options?: Partial<SWRConfiguration>,
) {
  const { data, ...rest } = useSWR<GroupSessionData[], Error>(
    `/api/host/${hostId}/sessions`,
    async (url) => {
      const res = await fetch(url);
      throwIfUnauthorised(res);

      if (!res.ok) {
        if (res.status === 403) throw new Error("You don't own these sessions");
        throw new Error("Your group sessions couldn't be fetched");
      }
      return (await res.json()).data;
    },
    {
      errorRetryCount: 1,
      fallbackData: [],
      ...options,
    },
  );

  return { data: data ?? [], ...rest };
}

export function useCreateGroupSessionSWRMutation(
  options?: Partial<SWRMutationConfiguration<any, Error, string>>,
) {
  return useSWRMutation(
    "/api/sessions",
    async (
      url: string,
      { arg }: { arg: z.output<SessionCreateSchemaType> },
    ) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      });
      throwIfUnauthorised(res);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Unknown error");
      }

      return res.json();
    },
    { ...options },
  );
}

export function useDeleteGroupSessionSWRMutation(
  options?: Partial<SWRMutationConfiguration<string, Error, string>>,
) {
  return useSWRMutation(
    "/api/sessions",
    async (url: string, { arg }: { arg: { code: string } }) => {
      const res = await fetch(`${url}/${arg.code}`, {
        method: "DELETE",
      });
      throwIfUnauthorised(res);

      if (!res.ok) {
        if (res.status === 403) throw new Error("You don't own this session");
        else {
          const data = await res.json();
          throw new Error(data.error?.message ?? "Unknown error");
        }
      }

      return arg.code;
    },
    { ...options },
  );
}

export function usePatchGroupSessionSWRMutation(
  options?: Partial<SWRMutationConfiguration<any, Error, string>>,
) {
  return useSWRMutation(
    "/api/sessions",
    async (
      url: string,
      {
        arg,
      }: {
        arg: { code: string; data: Partial<z.output<SessionCreateSchemaType>> };
      },
    ) => {
      const res = await fetch(`${url}/${arg.code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg.data),
      });
      throwIfUnauthorised(res);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Unknown error");
      }

      return res.json();
    },
    { ...options },
  );
}
