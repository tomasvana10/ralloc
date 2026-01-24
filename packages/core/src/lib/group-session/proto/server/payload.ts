import type {
  GroupSessionData,
  GroupSessionGroupData,
} from "@core/db/group-session";
import type {
  GroupMembersClearErrorMessage,
  GroupMutationErrorMessage,
} from "@core/db/group-session/actions/admin";
import type { GroupMembershipErrorMessage } from "@core/db/group-session/actions/membership";
import type * as GSClient from "../client";
import type { Code } from "./code";

type Yes = 1;
type No = 0;

/**
 * Generic base type for any payload that serves as:
 *   1. The sole response to the original client's payload in
 *      case of error.
 *   2. A response to the original client and all connected clients
 *      (of a group session) to update their state.
 */
type DynamicRelayableAction<
  TCode extends Code,
  TContext extends {
    action: GSClient.CodeEnumType[keyof GSClient.CodeEnumType];
  },
  TError extends string,
> =
  | {
      ok: Yes;
      code: TCode;
      context: TContext;
      id: string;
    }
  | {
      ok: No;
      code: TCode;
      error: TError;
      id: string;
      willSync: boolean;
    };

export type GroupMembership = DynamicRelayableAction<
  Code.GroupMembership,
  {
    action:
      | GSClient.CodeEnumType["JoinGroup"]
      | GSClient.CodeEnumType["LeaveGroup"];
    compressedUser: string;
    groupName: string;
  },
  GroupMembershipErrorMessage
>;

export type GroupMembersClear = DynamicRelayableAction<
  Code.GroupMembersClear,
  | { action: GSClient.CodeEnumType["ClearAllGroupMembers"] }
  | {
      action: GSClient.CodeEnumType["ClearGroupMembers"];
      groupName: string;
    },
  GroupMembersClearErrorMessage
>;

export type GroupMutation = DynamicRelayableAction<
  Code.GroupMutation,
  | {
      action: GSClient.CodeEnumType["AddGroup"];
      group: Omit<GroupSessionGroupData, "members">;
    }
  | { action: GSClient.CodeEnumType["RemoveGroup"]; groupName: string },
  GroupMutationErrorMessage
>;

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
  id: string;
};

export type PayloadType =
  | GroupMembership
  | GroupMembersClear
  | GroupMutation
  | Synchronise
  | PartialSynchronise
  | MessageRateLimit;
