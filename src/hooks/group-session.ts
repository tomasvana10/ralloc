import useSWR, { type SWRConfiguration } from "swr";
import useSWRMutation, { type SWRMutationConfiguration } from "swr/mutation";
import type z from "zod";
import type { GroupSessionData } from "@/db/group-session";
import type { SessionCreateSchemaType } from "@/features/forms/session-create";
import { checkResponse } from "@/lib/utils";

export function useGetGroupSessionsSWR(
  hostId: string,
  options?: Partial<SWRConfiguration>,
) {
  const { data, ...rest } = useSWR<GroupSessionData[], Error>(
    `/api/host/${hostId}/sessions`,
    async (url) => {
      const res = await fetch(url);
      const json = await checkResponse(res, {
        hasJSONBody: true,
        errCtx: "Fetch group session",
      });
      return json.data;
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
  options?: Partial<
    SWRMutationConfiguration<Pick<GroupSessionData, "code">, Error, string>
  >,
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
      return await checkResponse(res, {
        hasJSONBody: true,
        errCtx: "Create group session",
      });
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
      await checkResponse(res, {
        hasJSONBody: false,
        errCtx: "Delete group session",
      });
      return arg.code;
    },
    { ...options },
  );
}

export function usePatchGroupSessionSWRMutation(
  options?: Partial<SWRMutationConfiguration<void, Error, string>>,
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
      await checkResponse(res, {
        hasJSONBody: false,
        errCtx: "Update group session",
      });
    },
    { ...options },
  );
}
