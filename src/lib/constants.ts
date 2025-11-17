import type { ProviderId } from "next-auth/providers";
import {
  GitHubLightLogo,
  GitHubLogo,
  GoogleLogo,
  type ProviderSVG,
} from "@/components/provider-svgs";

export const SESSION_CODE_LENGTH = 6;
export const SESSION_CODE_CHARACTERS_EXCLUDE = "0l1"; // exclude similar-looking characters for code legibility
export const SESSION_CODE_CHARACTERS = Array.from(
  "abcdefghijklmnopqrstuvwxyz0123456789",
)
  .filter((char) => !SESSION_CODE_CHARACTERS_EXCLUDE.includes(char))
  .join("");
export const MAX_USER_SESSIONS = 10;

export const PROVIDER_DATA = {
  google: {
    defaultIcon: GoogleLogo,
    darkIcon: null,
  },
  github: {
    defaultIcon: GitHubLogo,
    darkIcon: GitHubLightLogo,
  },
} as const satisfies Partial<
  Record<ProviderId, { defaultIcon: ProviderSVG; darkIcon: ProviderSVG | null }>
>;
