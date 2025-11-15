import type { GroupSessionData } from "@/db/session";
import type { GroupSessionC2S } from "./c2s-messaging";

export namespace GroupSessionS2C {
  export enum Code {
    GroupUpdateStatus = "GroupUpdateStatus",
    Synchronise = "Synchronise",
  }

  export type GroupUpdateStatusAction = Extract<
    "JoinGroup" | "LeaveGroup",
    keyof typeof GroupSessionC2S.code.enum
  >;

  /**
   * Payload sent in response to a client joining/leaving a group
   */
  export type GroupUpdateStatusPayload =
    | {
        status: 0; // group was successfully joined/left
        code: Code.GroupUpdateStatus;
        action: GroupUpdateStatusAction;
        context: {
          groupName: string;
          userId: string;
        };
      }
    | {
        status: 1; // group could not be joined/left
        code: Code.GroupUpdateStatus;
        action: GroupUpdateStatusAction;
        error: string;
      };

  /**
   * Payload sent periodically to ensure the client's data is accurate (in case
   * some websocket transmissions of {@link GroupUpdateStatusPayload} failed).
   */
  export type SynchronisePayload = {
    code: Code.Synchronise;
    data: GroupSessionData;
  };

  export type Payload = GroupUpdateStatusPayload | SynchronisePayload;
}
