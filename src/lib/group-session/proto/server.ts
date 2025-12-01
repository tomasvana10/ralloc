import type {
  GroupSessionData,
  JoinGroupErrorMessage,
  LeaveGroupErrorMessage,
} from "@/db/group-session";
import type { GSClient } from ".";

/**
 * Server library for group session websockets
 */
export namespace GSServer {
  export namespace CloseEventCodes {
    export const GroupSessionWasDeleted = 4410;
    export const RateLimited = 4429;
    export const Forbidden = 4403;
  }

  /**
   * How many successful responses the server must send to a client before it sends
   * a precautionary {@link Payloads.Synchronise} payload. These responses are generally
   * payloads of {@link Payloads.GroupUpdateStatus}, and since they do not provide the full
   * data, this variable is useful.
   */
  export const SUCCESSFUL_RESPONSES_BEFORE_RESYNC = 10;

  /**
   * The minimum time in miliseconds between two unsuccessful responses for the server
   * to resend the full group session data.
   */
  export const GUPDATE_FAILURE_SYNC_TIMEOUT = 5000;

  /**
   * How frequently a ping frame should be sent to the client.
   *
   * Recommended by Cloudflare on [this page](https://developers.cloudflare.com/network/websockets/)
   * to keep sockets alive.
   */
  export const PING_INTERVAL_MS = 45000;

  export const MSG_SIZE_LIMIT = 1024;

  export enum Code {
    GroupUpdateStatus = "GUpdate",
    Synchronise = "Sync",
    PartialSynchronise = "PSync",
    MessageRateLimit = "RateLimit",
  }

  export namespace Payloads {
    type _BaseGroupUpdateStatus = {
      code: Code.GroupUpdateStatus;
      acknum: number;
      action: Extract<GSClient.Code, "Join" | "Leave">;
    };

    /**
     * Payload sent in response to a client joining/leaving a group
     */
    export type GroupUpdateStatus =
      | ({
          ok: 1;
          isReply: 0 | 1;
          context: {
            compressedUser: string;
            groupName: string;
          };
        } & _BaseGroupUpdateStatus)
      | ({
          ok: 0;
          willSync: boolean;
          error: JoinGroupErrorMessage | LeaveGroupErrorMessage;
        } & _BaseGroupUpdateStatus);

    /**
     * Payload sent to the client when:
     *  1. They connect to the websocket.
     *  2. They have sent a JoinGroup or LeaveGroup payload which resulted
     *     in a {@link GroupUpdateStatusPayload} of `ok: 1` being sent
     *     in return at least {@link SuccessfulResponsesBeforeResynchronise} times.
     *  3. A {@link GroupUpdateStatusPayload} of `ok: 0` was sent to
     *     the client and it has been at least {@link GUPTED_FAILURE_SYNC_TIMEOUT}
     *     miliseconds since the last such payload.
     */
    export type Synchronise = {
      code: Code.Synchronise;
      data: GroupSessionData;
    };

    /**
     * Payload sent to the client when a PATCH of a session has been processed.
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
      acknum: number;
    };
  }

  export type Payload =
    | Payloads.GroupUpdateStatus
    | Payloads.Synchronise
    | Payloads.PartialSynchronise
    | Payloads.MessageRateLimit;
}
