import React from "react";
import type { GroupSessionData } from "@/db/group-session";
import { UserRepresentation } from "@/lib/group-session";
import {
  GroupSessionC2S,
  GroupSessionS2C,
} from "@/lib/group-session/messaging";
import { useWebSocket } from "@/lib/hooks/websocket";
import { canSend, getFullGroupUpdateErrorMessage } from "./utils";

type GroupSessionState = GroupSessionData | null;

type GroupSessionUpdateAction =
  | {
      type: "JoinGroup";
      payload: Extract<
        GroupSessionS2C.Payloads.GroupUpdateStatus,
        { ok: 1 }
      >["context"];
    }
  | {
      type: "LeaveGroup";
      payload: Extract<
        GroupSessionS2C.Payloads.GroupUpdateStatus,
        { ok: 1 }
      >["context"];
    }
  | {
      type: "Synchronise";
      payload: GroupSessionS2C.Payloads.Synchronise["data"];
    };

function groupSessionReducer(
  state: GroupSessionState,
  action: GroupSessionUpdateAction,
): GroupSessionState {
  if (action.type === "Synchronise") {
    return action.payload;
  }
  if (!state) return null;

  if (action.type === "JoinGroup" || action.type === "LeaveGroup") {
    const { groupName, userId } = action.payload;
    const iGroup = state.groups.findIndex((group) => group.name === groupName);
    if (iGroup === -1) return state;

    const groups = [...state.groups];
    const group = { ...groups[iGroup] };

    switch (action.type) {
      case "JoinGroup": {
        if (
          !group.members.some((member) =>
            UserRepresentation.areSameCompressedUser(userId, member),
          )
        )
          group.members = [...group.members, action.payload.userId];
        break;
      }
      case "LeaveGroup": {
        group.members = group.members.filter(
          (member) => !UserRepresentation.areSameCompressedUser(userId, member),
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
  onError?: (msg: string) => any;
  onClose?: (reason: string) => any;
}

export function useGroupSession({
  code,
  onClose,
  onError,
}: UseGroupSessionParams) {
  const ws = useWebSocket(() => `/api/session-ws/${code}`);

  const [data, dispatchGroupSession] = React.useReducer(
    groupSessionReducer,
    null,
  );

  const joinGroup = React.useCallback(
    // userId is only required for optimistic client-sided updates
    (groupName: string, userId: string) => {
      const payload: GroupSessionC2S.Payloads.JoinGroup = {
        code: GroupSessionC2S.code.enum.JoinGroup,
        groupName,
      };
      if (canSend(ws)) {
        ws.send(JSON.stringify(payload));
        dispatchGroupSession({
          payload: { groupName, userId },
          type: "JoinGroup",
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
    // both groupName and userId are only required for optimistic client-sided updates
    (groupName: string, userId: string) => {
      const payload: GroupSessionC2S.Payloads.LeaveGroup = {
        code: GroupSessionC2S.code.enum.LeaveGroup,
      };
      if (canSend(ws)) {
        ws.send(JSON.stringify(payload));
        // optimistically update
        dispatchGroupSession({
          payload: { groupName, userId },
          type: "LeaveGroup",
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
        let data: GroupSessionS2C.Payload;
        try {
          data = JSON.parse(ev.data);
        } catch {
          return onError?.("Invalid data received from server");
        }

        switch (data.code) {
          case GroupSessionS2C.Code.GroupUpdateStatus: {
            const { groupName, userId } = data.context;

            if (!data.ok) {
              // revert optimistic update
              dispatchGroupSession({
                payload: {
                  groupName,
                  userId,
                },
                type: data.action === "JoinGroup" ? "LeaveGroup" : "JoinGroup",
              });
              onError?.(getFullGroupUpdateErrorMessage(data.error));
            } else if (!data.isReply) {
              // this payload isn't a direct reply to the original client, but
              // a one of the payloads broadcasted to all the other clients,
              // so we must update the state.

              dispatchGroupSession({
                payload: {
                  groupName,
                  userId,
                },
                type: data.action,
              });
            }
            break;
          }
          case GroupSessionS2C.Code.Synchronise: {
            dispatchGroupSession({ payload: data.data, type: "Synchronise" });
            break;
          }
          default:
            return onError?.("Invalid payload received from server");
        }
      },
      ctl,
    );

    ws?.addEventListener("error", (ev) => onError?.(String(ev)), ctl);
    ws?.addEventListener("close", (ev) => onClose?.(String(ev.reason)), ctl);

    return () => ctl.abort();
  }, [ws, onError, onClose]);

  return { data, joinGroup, leaveGroup } as const;
}
