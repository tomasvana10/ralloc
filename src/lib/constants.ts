import type { ProviderId } from "next-auth/providers";

export const SESSION_CODE_LENGTH = 6;
export const SESSION_CODE_CHARACTERS_EXCLUDE = "0l1"; // exclude similar-looking characters for code legibility
export const SESSION_CODE_CHARACTERS = Array.from(
  "abcdefghijklmnopqrstuvwxyz0123456789",
)
  .filter((char) => !SESSION_CODE_CHARACTERS_EXCLUDE.includes(char))
  .join("");
export const MAX_USER_SESSIONS = 10;
export const PROVIDER_SVGS = {
  google: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
  github:
    "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg",
} as const satisfies Partial<Record<ProviderId, string>>;
