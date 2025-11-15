import type { GroupSessionData } from "@/db/session";
import type { groupSessionC2SCode } from "./c2s-messaging";

export enum GroupSessionS2CCode {
  GroupUpdateStatus = "GroupUpdateStatus",
  Synchronise = "Synchronise",
}

type GroupUpdateStatusAction = Extract<
  "JoinGroup" | "LeaveGroup",
  keyof typeof groupSessionC2SCode.enum
>;

/**
 * Payload sent in response to a client joining/leaving a group
 */
export type GroupSessionS2CGroupUpdateStatusPayload =
  | {
      status: 0; // group was successfully joined/left
      code: GroupSessionS2CCode.GroupUpdateStatus;
      action: GroupUpdateStatusAction;
      context: {
        groupName: string;
        userId: string;
      };
    }
  | {
      status: 1; // group could not be joined/left
      code: GroupSessionS2CCode.GroupUpdateStatus;
      action: GroupUpdateStatusAction;
      error: string;
    };

/**
 * Payload sent periodically to ensure the client's data is accurate (in case
 * some websocket transmissions of {@link GroupSessionS2CGroupUpdateStatusPayload} failed).
 */
export type GroupSessionS2CSynchronisePayload = {
  code: GroupSessionS2CCode.Synchronise;
  data: GroupSessionData;
};

export type GroupSessionS2CPayload =
  | GroupSessionS2CGroupUpdateStatusPayload
  | GroupSessionS2CSynchronisePayload;
