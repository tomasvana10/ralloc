import React from "react";
import type { GroupSessionData } from "@/db/group-session";
import { UserRepresentation } from "@/lib/group-session";
import {
  GroupSessionC2S,
  GroupSessionS2C,
} from "@/lib/group-session/messaging";
import { useWebSocket } from "@/lib/hooks/websocket";
import {
  canSend,
  findCurrentGroup,
  getFullGroupUpdateErrorMessage,
} from "./utils";

type GroupSessionState = GroupSessionData | null;

type GroupSessionUpdateAction =
  | {
      type: "J";
      payload: {
        groupName: string;
        compressedUser: string;
      };
    }
  | {
      type: "L";
      payload: {
        groupName: string;
        compressedUser: string;
      };
    }
  | {
      type: "S";
      payload: Pick<GroupSessionS2C.Payloads.Synchronise, "data">;
    };

function groupSessionReducer(
  state: GroupSessionState,
  action: GroupSessionUpdateAction,
): GroupSessionState {
  if (action.type === "S") {
    return action.payload.data;
  }
  if (!state) return null;

  if (action.type === "J" || action.type === "L") {
    const { groupName, compressedUser } = action.payload;
    const iGroup = state.groups.findIndex((group) => group.name === groupName);
    if (iGroup === -1) return state;

    const groups = [...state.groups];
    const group = { ...groups[iGroup] };

    switch (action.type) {
      case "J": {
        if (
          !group.members.some((member) =>
            UserRepresentation.areSameCompressedUser(compressedUser, member),
          )
        )
          group.members = [...group.members, compressedUser];
        break;
      }
      case "L": {
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
  onClose?: (reason: string) => any;
}

export function useGroupSession({
  code,
  thisCompressedUser,
  onClose,
  onError,
}: UseGroupSessionParams) {
  const ws = useWebSocket(() => `/api/session-ws/${code}`);

  const [data, dispatchGroupSession] = React.useReducer(
    groupSessionReducer,
    null,
  );

  const currentGroup = React.useMemo(() => {
    if (!data) return null;
    return findCurrentGroup(data, thisCompressedUser);
  }, [data, thisCompressedUser]);

  const joinGroup = React.useCallback(
    // compressedUser is only required for optimistic client-sided updates
    (groupName: string, compressedUser: string) => {
      const payload: GroupSessionC2S.Payloads.JoinGroup = {
        code: GroupSessionC2S.code.enum.JoinGroup,
        groupName,
      };
      if (canSend(ws)) {
        ws.send(JSON.stringify(payload));
        dispatchGroupSession({
          payload: { groupName, compressedUser },
          type: "J",
        });
      } else {
        onError?.(
          "Your client can no longer connect to the server. Please refresh the page.",
        );
      }
    },
    [ws, onError],
  );

  const leaveGroup = React.useCallback(
    // both groupName and compressedUser are only required for optimistic client-sided updates
    (groupName: string, compressedUser: string) => {
      const payload: GroupSessionC2S.Payloads.LeaveGroup = {
        code: GroupSessionC2S.code.enum.LeaveGroup,
      };
      if (canSend(ws)) {
        ws.send(JSON.stringify(payload));
        // optimistically update
        dispatchGroupSession({
          payload: { groupName, compressedUser },
          type: "L",
        });
      } else {
        onError?.(
          "Your client can no longer connect to the server. Please refresh the page.",
        );
      }
    },
    [ws, onError],
  );

  React.useEffect(() => {
    const ctl = new AbortController();

    ws?.addEventListener(
      "message",
      (ev) => {
        let payload: GroupSessionS2C.Payload;
        try {
          payload = JSON.parse(ev.data);
        } catch {
          return onError?.("Invalid data received from server");
        }

        switch (payload.code) {
          case GroupSessionS2C.Code.GroupUpdateStatus: {
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
                      payload.action === "L"
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
                    payload.action === "J" ? "L" : "J",
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
                    payload.action === "J"
                      ? payload.context.g2!
                      : payload.context.g1!,
                  compressedUser: context.compressedUser,
                },
                type: payload.action,
              });

            break;
          }
          case GroupSessionS2C.Code.Synchronise: {
            dispatchGroupSession({
              payload: { data: payload.data },
              type: "S",
            });
            break;
          }
          default:
            return onError?.("Invalid payload received from server");
        }
      },
      ctl,
    );

    ws?.addEventListener("error", (ev) => onError?.(String(ev)), ctl);
    ws?.addEventListener(
      "close",
      (ev) => ev.reason && onClose?.(String(ev.reason)),
      ctl,
    );

    return () => ctl.abort();
  }, [ws, onError, onClose]);

  return { data, currentGroup, joinGroup, leaveGroup } as const;
}
