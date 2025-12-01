import React, { useRef } from "react";
import useWebSocket from "react-use-websocket-lite";
import type { GroupSessionData } from "@/db/group-session";
import { UserRepresentation } from "@/lib/group-session";
import { GSClient, GSServer } from "@/lib/group-session/proto";
import { findCurrentGroup, getFullGroupUpdateErrorMessage } from "./utils";

type GroupSessionState = GroupSessionData | null;

type GroupSessionUpdateAction =
  | {
      type: "Join";
      payload: {
        groupName: string;
        compressedUser: string;
      };
    }
  | {
      type: "Leave";
      payload: {
        groupName: string;
        compressedUser: string;
      };
    }
  | {
      type: "Sync";
      payload: { data: GroupSessionData };
    }
  | {
      type: "PSync";
      payload: { data: Partial<GroupSessionData> };
    }
  | { type: "Freeze" }
  | { type: "Rollback"; payload: { data: GroupSessionData } };

function groupSessionReducer(
  state: GroupSessionState,
  action: GroupSessionUpdateAction,
): GroupSessionState {
  if (action.type === "Sync") {
    return action.payload.data;
  }
  if (action.type === "Rollback") {
    return { ...action.payload.data };
  }
  if (!state) return null;

  if (action.type === "PSync") {
    Object.assign(state, action.payload.data);
    return { ...state };
  }

  if (action.type === "Freeze") {
    state.frozen = true;
    return { ...state };
  }

  if (action.type === "Join" || action.type === "Leave") {
    const { groupName, compressedUser } = action.payload;
    const iGroup = state.groups.findIndex((group) => group.name === groupName);
    if (iGroup === -1) return state;

    const groups = [...state.groups];
    const group = { ...groups[iGroup] };

    switch (action.type) {
      case "Join": {
        if (
          !group.members.some((member) =>
            UserRepresentation.areSameCompressedUser(compressedUser, member),
          )
        )
          group.members = [...group.members, compressedUser];
        break;
      }
      case "Leave": {
        group.members = group.members.filter(
          (member) =>
            !UserRepresentation.areSameCompressedUser(compressedUser, member),
        );
        break;
      }
    }

    groups[iGroup] = group;

    return {
      ...state,
      groups,
    };
  }

  return state;
}

interface UseGroupSessionParams {
  code: string;
  thisCompressedUser: string;
  onError?: (msg: string) => any;
  onClose?: (code: number, reason: string) => any;
  onOpen?: () => any;
  onReconnectStop?: (n: number) => any;
}

export function useGroupSession({
  code,
  thisCompressedUser,
  onClose,
  onError,
  onOpen,
  onReconnectStop,
}: UseGroupSessionParams) {
  const [data, dispatchGroupSession] = React.useReducer(
    groupSessionReducer,
    null,
  );
  const seqnumRef = useRef(0);
  const rollbacksRef = useRef(new Map<number, GroupSessionData>());

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
    onMessage: (ev) => {
      let payload: GSServer.Payload;
      try {
        payload = JSON.parse(ev.data);
      } catch {
        return onError?.("Invalid data received from server");
      }

      switch (payload.code) {
        case GSServer.Code.GroupUpdateStatus: {
          // failure
          if (!payload.ok) {
            onError?.(getFullGroupUpdateErrorMessage(payload.error));
            if (!payload.willSync) {
              dispatchGroupSession({
                type: "Rollback",
                payload: { data: rollbacksRef.current.get(payload.acknum)! },
              });
              rollbacksRef.current.delete(payload.acknum);
            }

            break;
          }

          // success
          rollbacksRef.current.delete(payload.acknum);
          // this checks if the payload is a direct reply to the original client that joined
          // or left the group. if not, no optimistic state update was performed, and a proper
          // update must be performed
          if (!payload.isReply)
            dispatchGroupSession({
              payload: {
                groupName: payload.context.groupName,
                compressedUser: payload.context.compressedUser,
              },
              type: payload.action,
            });

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
            payload: { data: rollbacksRef.current.get(payload.acknum)! },
          });
          rollbacksRef.current.delete(payload.acknum);
          onError?.(
            "You are sending too many requests. Please try again soon.",
          );
          break;
        }
        default:
          return onError?.(
            "Invalid/unsupported payload received from server. Try reloading your page.",
          );
      }
    },
  });

  const currentGroup = React.useMemo(() => {
    if (!data) return null;
    return findCurrentGroup(data, thisCompressedUser);
  }, [data, thisCompressedUser]);

  const joinGroup = React.useCallback(
    (groupName: string, compressedUser: string) => {
      const seqnum = ++seqnumRef.current; // seqnum starts at 1
      const payload: GSClient.Payloads.JoinGroup = {
        code: GSClient.code.enum.JoinGroup,
        seqnum,
        compressedUser,
        groupName,
      };
      if (data) rollbacksRef.current.set(seqnum, data);

      sendMessage(JSON.stringify(payload));
      dispatchGroupSession({
        payload: { groupName, compressedUser },
        type: "Join",
      });
    },
    [sendMessage, data],
  );

  const leaveGroup = React.useCallback(
    // compressedUser is only required for optimistic client-sided updates
    (groupName: string, compressedUser: string) => {
      const seqnum = ++seqnumRef.current; // seqnum starts at 1
      const payload: GSClient.Payloads.LeaveGroup = {
        code: GSClient.code.enum.LeaveGroup,
        seqnum,
        compressedUser,
      };
      if (data) rollbacksRef.current.set(seqnum, data);

      sendMessage(JSON.stringify(payload));
      dispatchGroupSession({
        payload: { groupName, compressedUser },
        type: "Leave",
      });
    },
    [sendMessage, data],
  );

  const freezeThisClient = React.useCallback(
    () => dispatchGroupSession({ type: "Freeze" }),
    [],
  );

  return {
    data,
    currentGroup,
    joinGroup,
    leaveGroup,
    freezeThisClient,
    wsReadyState: readyState,
  } as const;
}
