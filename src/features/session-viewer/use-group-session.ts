import React from "react";
import useWebSocket, { type Options } from "react-use-websocket-lite";
import type {
  GroupSessionData,
  GroupSessionGroupData,
} from "@/db/group-session";
import { getRateLimitMessage } from "@/db/rate-limit/utils";
import { UserRepresentation } from "@/lib/group-session";
import { GSClient, GSServer } from "@/lib/group-session/proto";
import { findCurrentGroup, getErrorMessage } from "./utils";

type GroupSessionState = GroupSessionData | null;

type GroupSessionUpdateAction =
  | {
      type: "Join" | "Leave";
      payload: {
        groupName: string;
        compressedUser: string;
      };
    }
  | { type: "AddGroup" | "RemGroup"; payload: { groupName: string } }
  | { type: "ClearGroupMem"; payload: { groupName: string } }
  | {
      type: "Sync";
      payload: { data: GroupSessionData };
    }
  | {
      type: "PSync";
      payload: { data: Partial<GroupSessionData> };
    }
  | { type: "Rollback"; payload: { data?: GroupSessionData } }
  | { type: "Freeze" | "ClearAllGroupMem" };

function _findGroupIndex(
  groups: GroupSessionGroupData[],
  groupName: string,
): number {
  return groups.findIndex((g) => g.name === groupName);
}

type _GroupUpdater = (
  group: GroupSessionGroupData,
) => GroupSessionGroupData | null;

function _updateGroupAtIndex(
  state: GroupSessionData,
  iGroup: number,
  updater: _GroupUpdater,
): GroupSessionState {
  const group = state.groups[iGroup];
  const updatedGroup = updater(group);

  if (updatedGroup === null) return state;

  const groups = [...state.groups];
  groups[iGroup] = updatedGroup;

  return { ...state, groups };
}

function _updateGroup(
  state: GroupSessionData,
  groupName: string,
  updater: _GroupUpdater,
): GroupSessionState {
  const iGroup = _findGroupIndex(state.groups, groupName);
  if (iGroup === -1) return state;

  return _updateGroupAtIndex(state, iGroup, updater);
}

function groupSessionReducer(
  state: GroupSessionState,
  action: GroupSessionUpdateAction,
): GroupSessionState {
  switch (action.type) {
    case "Sync":
      return action.payload.data;
    case "Rollback":
      if (!action.payload.data) return state;
      return { ...action.payload.data };
  }

  if (!state) return null;

  switch (action.type) {
    case "PSync":
      return { ...state, ...action.payload.data };
    case "Freeze":
      return { ...state, frozen: true };
    case "Join":
      return _updateGroup(state, action.payload.groupName, (group) => {
        const { compressedUser } = action.payload;
        if (
          group.members.some((m) =>
            UserRepresentation.areSameCompressedUser(compressedUser, m),
          )
        )
          return null;

        return { ...group, members: [...group.members, compressedUser] };
      });
    case "Leave":
      return _updateGroup(state, action.payload.groupName, (group) => {
        const { compressedUser } = action.payload;
        const members = group.members.filter(
          (m) => !UserRepresentation.areSameCompressedUser(compressedUser, m),
        );

        if (members.length === group.members.length) return null;

        return { ...group, members };
      });
    case "AddGroup": {
      const { groupName } = action.payload;
      if (state.groups.some((g) => g.name === groupName)) return state;

      return {
        ...state,
        groups: [...state.groups, { name: groupName, members: [] }],
      };
    }
    case "RemGroup": {
      const { groupName } = action.payload;
      const iGroup = _findGroupIndex(state.groups, groupName);
      if (iGroup === -1) return state;

      return {
        ...state,
        groups: [
          ...state.groups.slice(0, iGroup),
          ...state.groups.slice(iGroup + 1),
        ],
      };
    }
    case "ClearGroupMem":
      return _updateGroup(state, action.payload.groupName, (group) => {
        if (group.members.length === 0) return null;

        return { ...group, members: [] };
      });
    case "ClearAllGroupMem": {
      const anyMembers = state.groups.some((g) => g.members.length > 0);
      // prevent unecessary reference updates if no members are in any group
      if (!anyMembers) return state;

      return {
        ...state,
        groups: state.groups.map((group) =>
          group.members.length > 0 ? { ...group, members: [] } : group,
        ),
      };
    }
  }
}

interface UseGroupSessionOptions {
  code: string;
  compressedUser: string;
  onError?: (msg: string) => any;
  onClose?: (code: number, reason: string) => any;
  onOpen?: () => any;
  onReconnectStop?: (n: number) => any;
  wsOptions?: Pick<
    Options,
    | "maxReconnectAttempts"
    | "protocols"
    | "url"
    | "shouldReconnect"
    | "retryOnError"
    | "messageTimeout"
  >;
}

export type UseGroupSessionReturn = ReturnType<typeof useGroupSession>;
type Rollbacks = Map<string, GroupSessionData>;

export function useGroupSession({
  code,
  compressedUser,
  onClose,
  onError,
  onOpen,
  onReconnectStop,
  wsOptions,
}: UseGroupSessionOptions) {
  const [data, dispatchGroupSession] = React.useReducer(
    groupSessionReducer,
    null,
  );

  // id => GroupSessionData
  const rollbacksRef = React.useRef<Rollbacks>(new Map());
  const dataRef = React.useRef<GroupSessionData>(null);

  React.useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const { sendMessage, readyState } = useWebSocket({
    url: `/api/session-ws/${code}`,
    shouldReconnect: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    onOpen: () => onOpen?.(),
    onReconnectStop: (n: number) => onReconnectStop?.(n),
    onClose: (ev) => {
      rollbacksRef.current.clear();
      onClose?.(ev.code, ev.reason);
    },
    onMessage: (ev) =>
      onMessage(ev, onError, dispatchGroupSession, rollbacksRef),
    ...wsOptions,
  });

  const currentGroup = React.useMemo(() => {
    if (!data) return null;
    return findCurrentGroup(data, compressedUser);
  }, [data, compressedUser]);

  const _sendAndDispatch = React.useCallback(
    <T extends GSClient.Payload>(
      createPayload: (id: string) => T,
      dispatchAction: GroupSessionUpdateAction,
    ) => {
      const id = GSClient.createPayloadId();
      const payload = createPayload(id);
      if (dataRef.current) rollbacksRef.current.set(id, dataRef.current);
      // because the client maintains its state through optimistic updates,
      // websocket message queueing is disabled, as it would break stuff.
      sendMessage(JSON.stringify(payload), false);
      dispatchGroupSession(dispatchAction);
    },
    [sendMessage],
  );

  const joinGroup = React.useCallback(
    (groupName: string, compressedUser: string) =>
      _sendAndDispatch(
        (id) => ({
          code: GSClient.code.enum.JoinGroup,
          id,
          compressedUser,
          groupName,
        }),
        { type: "Join", payload: { groupName, compressedUser } },
      ),
    [_sendAndDispatch],
  );

  const leaveGroup = React.useCallback(
    (groupName: string, compressedUser: string) =>
      _sendAndDispatch(
        (id) => ({
          code: GSClient.code.enum.LeaveGroup,
          id,
          compressedUser,
        }),
        { type: "Leave", payload: { groupName, compressedUser } },
      ),
    [_sendAndDispatch],
  );

  const addGroup = React.useCallback(
    (groupName: string) =>
      _sendAndDispatch(
        (id) => ({ code: GSClient.code.enum.AddGroup, id, groupName }),
        { type: "AddGroup", payload: { groupName } },
      ),
    [_sendAndDispatch],
  );

  const removeGroup = React.useCallback(
    (groupName: string) =>
      _sendAndDispatch(
        (id) => ({ code: GSClient.code.enum.RemoveGroup, id, groupName }),
        { type: "RemGroup", payload: { groupName } },
      ),
    [_sendAndDispatch],
  );

  const clearGroupMembers = React.useCallback(
    (groupName: string) =>
      _sendAndDispatch(
        (id) => ({ code: GSClient.code.enum.ClearGroupMembers, id, groupName }),
        { type: "ClearGroupMem", payload: { groupName } },
      ),
    [_sendAndDispatch],
  );

  const clearAllGroupMembers = React.useCallback(
    () =>
      _sendAndDispatch(
        (id) => ({ code: GSClient.code.enum.ClearAllGroupMembers, id }),
        { type: "ClearAllGroupMem" },
      ),
    [_sendAndDispatch],
  );

  const freezeClient = React.useCallback(
    () => dispatchGroupSession({ type: "Freeze" }),
    [],
  );

  const isHost = !data
    ? false
    : UserRepresentation.areSameCompressedUser(
        data.compressedHost,
        compressedUser,
      );

  return {
    data,
    currentGroup,
    joinGroup,
    leaveGroup,
    addGroup,
    removeGroup,
    clearGroupMembers,
    clearAllGroupMembers,
    freezeClient,
    wsReadyState: readyState,
    isHost,
  } as const;
}

function onMessage(
  ev: MessageEvent<any>,
  onError: UseGroupSessionOptions["onError"],
  dispatchGroupSession: React.Dispatch<GroupSessionUpdateAction>,
  rollbacksRef: React.RefObject<Rollbacks>,
) {
  let payload: GSServer.Payload;
  try {
    payload = JSON.parse(ev.data);
  } catch {
    return onError?.("Invalid data received from server");
  }

  switch (payload.code) {
    case GSServer.Code.GroupMembersClear:
    case GSServer.Code.GroupMutation:
    case GSServer.Code.GroupMembership: {
      // failure
      if (!payload.ok) {
        if ("error" in payload) onError?.(getErrorMessage(payload.error));
        if (!payload.willSync) {
          dispatchGroupSession({
            type: "Rollback",
            payload: {
              data: rollbacksRef.current.get(payload.id),
            },
          });
        }
        rollbacksRef.current.delete(payload.id);

        break;
      }

      // success
      const isReply = rollbacksRef.current.has(payload.id);
      if (isReply) {
        // this is a direct reply, all that needs to be done is delete the rollback data
        rollbacksRef.current.delete(payload.id);
        break;
      }

      // isn't a directly reply to the original client, so the state must be updated
      if (payload.code === GSServer.Code.GroupMembership) {
        dispatchGroupSession({
          payload: {
            groupName: payload.context.groupName,
            compressedUser: payload.context.compressedUser,
          },
          type: payload.context.action,
        });
      } else if (payload.code === GSServer.Code.GroupMutation) {
        if (payload.context.action === "AddGroup") {
          dispatchGroupSession({
            payload: {
              groupName: payload.context.group.name,
            },
            type: payload.context.action,
          });
        } else {
          dispatchGroupSession({
            payload: {
              groupName: payload.context.groupName,
            },
            type: payload.context.action,
          });
        }
      } else {
        if (payload.context.action === "ClearGroupMem") {
          dispatchGroupSession({
            payload: {
              groupName: payload.context.groupName,
            },
            type: payload.context.action,
          });
        } else {
          dispatchGroupSession({
            type: payload.context.action,
          });
        }
      }

      break;
    }
    case GSServer.Code.Synchronise: {
      dispatchGroupSession({
        payload: { data: payload.data },
        type: "Sync",
      });
      break;
    }
    case GSServer.Code.PartialSynchronise: {
      dispatchGroupSession({
        payload: { data: payload.data },
        type: "PSync",
      });
      break;
    }
    case GSServer.Code.MessageRateLimit: {
      dispatchGroupSession({
        type: "Rollback",
        payload: { data: rollbacksRef.current.get(payload.id) },
      });
      rollbacksRef.current.delete(payload.id);
      onError?.(getRateLimitMessage(undefined, payload.retryAfter));
      break;
    }
    default:
      return onError?.(
        "Invalid/unsupported payload received from server. Try reloading your page.",
      );
  }
}
