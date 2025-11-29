import {
  SESSION_CODE_CHARACTERS,
  SESSION_CODE_LENGTH,
} from "@/lib/group-session";

export function generateSessionCode(): string {
  const n = SESSION_CODE_LENGTH;

  let result = "";
  for (let i = 0; i < n; i++) {
    result +=
      SESSION_CODE_CHARACTERS[
        Math.floor(Math.random() * SESSION_CODE_CHARACTERS.length)
      ];
  }
  return result;
}
