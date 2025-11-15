import type { GroupSessionData } from "@/db/session";
import type { GroupSessionC2SCode } from "./c2s-messaging";

export enum GroupSessionS2CCode {
  GroupUpdateStatus = "GroupUpdateStatus",
}

export type GroupSessionS2CGroupUpdateStatusPayload =
  | {
      status: 0;
      type: GroupSessionS2CCode.GroupUpdateStatus;
      action: keyof typeof GroupSessionC2SCode.enum;
      data: GroupSessionData;
    }
  | {
      status: 1;
      type: GroupSessionS2CCode.GroupUpdateStatus;
      action: keyof typeof GroupSessionC2SCode.enum;
      error: string;
    };

export type GroupSessionS2CPayload = GroupSessionS2CGroupUpdateStatusPayload;
