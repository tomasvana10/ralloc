import type {
  GroupSessionData,
  JoinGroupResult,
  LeaveGroupResult,
} from "@/db/group-session";
import type { GroupSessionC2S } from ".";

export namespace GroupSessionS2C {
  export namespace CloseEventCodes {
    export const GroupSessionWasDeleted = 4000;
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

  export enum Code {
    GroupUpdateStatus = "GroupUpdateStatus",
    Synchronise = "Synchronise",
    PotentialAbuse = "PotentialAbuse",
  }

  export namespace Payloads {
    type GroupUpdateStatusAction = Extract<
      "JoinGroup" | "LeaveGroup",
      keyof typeof GroupSessionC2S.code.enum
    >;

    /**
     * Payload sent in response to a client joining/leaving a group
     */
    export type GroupUpdateStatus =
      | {
          status: "success";
          code: Code.GroupUpdateStatus;
          action: GroupUpdateStatusAction;
          context: {
            groupName: string;
            userId: string;
          };
        }
      | {
          status: "failure";
          code: Code.GroupUpdateStatus;
          action: GroupUpdateStatusAction;
          error: JoinGroupResult["error"] | LeaveGroupResult["error"];
        };

    /**
     * Payload sent to the client when:
     *  1. They connect to the websocket.
     *  2. They have sent a JoinGroup or LeaveGroup payload which resulted
     *     in a {@link GroupUpdateStatusPayload} of `status: 0` being sent
     *     in return at least NOT_IMPLEMENTED_YET times.
     *  3. A {@link GroupUpdateStatusPayload} of `status: 1` was sent to
     *     the client.
     */
    export type Synchronise = {
      code: Code.Synchronise;
      data: GroupSessionData;
    };

    /**
     * Payload sent in response to clients that are likely abusing the
     * websocket server :(
     */
    export type PotentialAbuse = {
      code: Code.PotentialAbuse;
      message: string;
    };
  }

  export type Payload =
    | Payloads.GroupUpdateStatus
    | Payloads.Synchronise
    | Payloads.PotentialAbuse;
}
