import type {
  GroupSessionData,
  GroupSessionGroupData,
} from "@/db/group-session";
import type {
  GroupMembersClearErrorMessage,
  GroupMutationErrorMessage,
} from "@/db/group-session/actions/admin";
import type {
  GroupJoinErrorMessage,
  GroupLeaveErrorMessage,
} from "@/db/group-session/actions/membership";
import type { GSClient } from ".";

/**
 * Server library for group session websockets
 */
export namespace GSServer {
  export namespace CloseEventCodes {
    export const GroupSessionWasDeleted = 4410;
    export const RateLimited = 4429;
    export const Forbidden = 4403;
    export const PotentialAbuse = 4467;
  }

  /**
   * How many successful responses the server must send to a client before it sends
   * a precautionary {@link Payloads.Synchronise} payload. These responses are generally
   * payloads of {@link Payloads.GroupMembershipStatus}, and since they do not provide the full
   * data, this variable is useful.
   */
  export const SUCCESSFUL_RESPONSES_BEFORE_RESYNC = 13;

  /**
   * The minimum time in miliseconds between two unsuccessful responses for the server
   * to resend the full group session data.
   */
  export const FAILURE_RESYNC_TIMEOUT = 5000;

  /**
   * How frequently a ping frame should be sent to the client.
   *
   * Recommended by Cloudflare on [this page](https://developers.cloudflare.com/network/websockets/)
   * to keep sockets alive.
   */
  export const PING_INTERVAL_MS = 45000;

  /**
   * Largest message size (in bytes) the websocket server will accept.
   */
  export const MSG_SIZE_LIMIT = 1024;

  /**
   * How many {@link Payloads.MessageRateLimit} payloads within one websocket session is considered
   * suspicious/abusive.
   */
  export const MIN_RATELIMITS_CONSIDERED_SUSPICIOUS = 20;

  export const UNRESTRICTED_C2S_PAYLOADS: Partial<Record<GSClient.Code, true>> =
    {
      Join: true,
      Leave: true,
    };

  export enum Code {
    GroupMembership = "GMemShip",
    GroupMembersClear = "GMemClear",
    GroupMutation = "GMut",
    Synchronise = "Sync",
    PartialSynchronise = "PSync",
    MessageRateLimit = "RateLimit",
  }

  export namespace Payloads {
    type Yes = 1;
    type No = 0;
    type IdField = { id: string };
    type WillSyncField = { willSync: boolean };

    /**
     * Payload sent in response to a client joining/leaving a group
     */
    export type GroupMembership =
      | ({
          ok: Yes;
          code: Code.GroupMembership;
          context: {
            action:
              | GSClient.ZodCode["JoinGroup"]
              | GSClient.ZodCode["LeaveGroup"];
            compressedUser: string;
            groupName: string;
          };
        } & IdField)
      | ({
          ok: No;
          code: Code.GroupMembership;
          error: GroupJoinErrorMessage | GroupLeaveErrorMessage;
        } & IdField &
          WillSyncField);

    /**
     * Payload sent in response to the members of one or all groups being cleared.
     */
    export type GroupMembersClear =
      | ({
          ok: Yes;
          code: Code.GroupMembersClear;
          context:
            | { action: GSClient.ZodCode["ClearAllGroupMembers"] }
            | {
                action: GSClient.ZodCode["ClearGroupMembers"];
                groupName: string;
              };
        } & IdField)
      | ({
          ok: No;
          code: Code.GroupMembersClear;
          error: GroupMembersClearErrorMessage;
        } & IdField &
          WillSyncField);

    /**
     * Payload sent in response to a group being added/deleted
     */
    export type GroupMutation =
      | ({
          ok: Yes;
          code: Code.GroupMutation;
          context:
            | {
                action: GSClient.ZodCode["AddGroup"];
                group: Omit<GroupSessionGroupData, "members">;
              }
            | { action: GSClient.ZodCode["RemoveGroup"]; groupName: string };
        } & IdField)
      | ({
          ok: No;
          code: Code.GroupMutation;
          error: GroupMutationErrorMessage;
        } & IdField &
          WillSyncField);

    /**
     * Payload sent to the client to fully update its state when:
     *  1. They connect to the websocket.
     *  2. They have sent a payload which resulted in a {@link BroadcastedPayload}
     *     assignable to `ok: Yes` being sent in return at least
     *     {@link SUCCESSFUL_RESPONSES_BEFORE_RESYNC} times.
     *  3. They have sent a payload which resulted in a {@link BroadcastedPayload}
     *     assignable to `ok: No`, OR, a {@link MessageRateLimit} payload being
     *     sent in return, and it has been at least {@link FAILURE_RESYNC_TIMEOUT}
     *     miliseconds since the last such payload of that nature.
     */
    export type Synchronise = {
      code: Code.Synchronise;
      data: GroupSessionData;
    };

    /**
     * Payload sent to the client when a partial update of a session has been processed.
     */
    export type PartialSynchronise = {
      code: Code.PartialSynchronise;
      data: Partial<GroupSessionData>;
    };

    /**
     * Payload to indicate to a client that they are sending too many messages to
     * the server.
     */
    export type MessageRateLimit = {
      code: Code.MessageRateLimit;
      retryAfter: number;
    } & IdField;
  }

  export type Payload =
    | Payloads.GroupMembership
    | Payloads.GroupMembersClear
    | Payloads.GroupMutation
    | Payloads.Synchronise
    | Payloads.PartialSynchronise
    | Payloads.MessageRateLimit;

  export function isAuthorisedToUsePayload(
    isHost: boolean,
    payload: GSClient.Code,
  ) {
    return UNRESTRICTED_C2S_PAYLOADS[payload] || isHost;
  }
}
