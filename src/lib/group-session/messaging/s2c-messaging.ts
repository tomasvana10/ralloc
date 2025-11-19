import type {
  GroupSessionData,
  JoinGroupResult,
  LeaveGroupResult,
} from "@/db/group-session";
import type { GroupSessionC2S } from ".";

/**
 * Server-to-client protocol library for group session websockets
 */
export namespace GroupSessionS2C {
  export namespace CloseEventCodes {
    export const GroupSessionWasDeleted = 4000;
    export const RateLimited = 4001;
  }

  /**
   * How many successful responses the server must send to a client before it sends
   * a precautionary {@link Payloads.Synchronise} payload. These responses are generally
   * payloads of {@link Payloads.GroupUpdateStatus}, and since they do not provide the full
   * data, this variable is useful.
   */
  export const SuccessfulResponsesBeforeResynchronise = 7;

  /**
   * The minimum time in miliseconds between two unsuccessful responses for the server
   * to resend the full group session data.
   */
  export const GroupUpdateFailureSynchroniseTimeoutMS = 3000;

  /**
   * How frequently a ping frame should be sent to the client.
   *
   * Recommended by Cloudflare on [this page](https://developers.cloudflare.com/network/websockets/)
   * to keep sockets alive.
   */
  export const PingFrameIntervalMS = 45000;

  export enum Code {
    GroupUpdateStatus = "GroupUpdateStatus",
    Synchronise = "Synchronise",
  }

  export namespace Payloads {
    export type GroupUpdateStatusAction = Extract<
      "JoinGroup" | "LeaveGroup",
      keyof typeof GroupSessionC2S.code.enum
    >;

    /**
     * Payload sent in response to a client joining/leaving a group
     */
    export type GroupUpdateStatus =
      | {
          ok: 1;
          code: Code.GroupUpdateStatus;
          action: GroupUpdateStatusAction;
          context: {
            groupName: string;
            userId: string;
          };
          asReply: 0 | 1;
        }
      | {
          ok: 0;
          code: Code.GroupUpdateStatus;
          action: GroupUpdateStatusAction;
          context: {
            groupName: string;
            userId: string;
          };
          error: Extract<
            JoinGroupResult["error"] | LeaveGroupResult["error"],
            string
          >;
        };

    /**
     * Payload sent to the client when:
     *  1. They connect to the websocket.
     *  2. They have sent a JoinGroup or LeaveGroup payload which resulted
     *     in a {@link GroupUpdateStatusPayload} of `ok: 1` being sent
     *     in return at least {@link SuccessfulResponsesBeforeResynchronise} times.
     *  3. A {@link GroupUpdateStatusPayload} of `ok: 0` was sent to
     *     the client and it has been at least {@link GroupUpdateFailureSynchroniseTimeoutMS}
     *     miliseconds since the last such payload.
     */
    export type Synchronise = {
      code: Code.Synchronise;
      data: GroupSessionData;
    };
  }

  export type Payload = Payloads.GroupUpdateStatus | Payloads.Synchronise;
}
