import { SESSION_CODE_CHARACTERS } from "./constants";

export enum MessageType {
  JoinSession,
  LeaveSession,
}

export function generateSessionCode(n: number): string {
  let result = "";
  for (let i = 0; i < n; i++) {
    result +=
      SESSION_CODE_CHARACTERS[
        Math.floor(Math.random() * SESSION_CODE_CHARACTERS.length)
      ];
  }
  return result;
}
