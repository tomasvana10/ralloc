import React from "react";
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
      payload: Pick<GSServer.Payloads.Synchronise, "data">;
    }
  | { type: "Freeze" };

function groupSessionReducer(
  state: GroupSessionState,
  action: GroupSessionUpdateAction,
): GroupSessionState {
  if (action.type === "Sync") {
    return action.payload.data;
  }
  if (!state) return null;

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

  const { sendMessage, readyState } = useWebSocket({
    url: `/api/session-ws/${code}`,
    shouldReconnect: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    onOpen: () => onOpen?.(),
    onReconnectStop: (n: number) => onReconnectStop?.(n),
    onClose: (ev) => onClose?.(ev.code, ev.reason),
    onMessage: (ev) => {
      let payload: GSServer.Payload;
      try {
        payload = JSON.parse(ev.data);
      } catch {
        return onError?.("Invalid data received from server");
      }

      switch (payload.code) {
        case GSServer.Code.GroupUpdateStatus: {
          const { context } = payload;

          // ! failure !
          if (!payload.ok) {
            onError?.(getFullGroupUpdateErrorMessage(payload.error));
            // sync payload from server will not be sent due to timeout, so we
            // must manually revert its optimistic update
            if (!payload.willSync) {
              if (context.g0 === context.g2) return;

              dispatchGroupSession({
                payload: {
                  groupName:
                    payload.action === "Leave"
                      ? // if the user tried leaving a group, they will be joined back to g2 -
                        // the group the server decided they are now in (their original group)
                        payload.context.g2!
                      : // if the user tried joining a group, they will be removed from g0 -
                        // the group they originally tried to join
                        payload.context.g0!,
                  compressedUser: context.compressedUser,
                },
                type:
                  // invert the action to undo the optimistic update
                  payload.action === "Join" ? "Leave" : "Join",
              });
            }

            break;
          }

          // ! success !
          // this checks if the payload is a direct reply to the original client that joined
          // or left the group. if not, no optimistic state update was performed, and a proper
          // update must be performed
          if (!payload.isReply)
            dispatchGroupSession({
              payload: {
                // since it was either a successful join or leave, g2 (new group) or g1 (old group)
                // respectively MUST be truthy
                groupName:
                  payload.action === "Join"
                    ? payload.context.g2!
                    : payload.context.g1!,
                compressedUser: context.compressedUser,
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
        case GSServer.Code.MessageRateLimit: {
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
      const payload: GSClient.Payloads.JoinGroup = {
        code: GSClient.code.enum.JoinGroup,
        compressedUser,
        groupName,
      };
      sendMessage(JSON.stringify(payload));
      dispatchGroupSession({
        payload: { groupName, compressedUser },
        type: "Join",
      });
    },
    [sendMessage],
  );

  const leaveGroup = React.useCallback(
    // compressedUser is only required for optimistic client-sided updates
    (groupName: string, compressedUser: string) => {
      const payload: GSClient.Payloads.LeaveGroup = {
        code: GSClient.code.enum.LeaveGroup,
        compressedUser,
      };
      sendMessage(JSON.stringify(payload));
      dispatchGroupSession({
        payload: { groupName, compressedUser },
        type: "Leave",
      });
    },
    [sendMessage],
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
