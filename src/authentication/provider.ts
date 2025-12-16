import type { ProviderId } from "next-auth/providers";

export const EPHEMERAL_PROVIDER = "ephemeral";
export type EphemeralProvider = typeof EPHEMERAL_PROVIDER;

export const OFFICIAL_PROVIDERS = {
  google: true,
  github: true,
} as const satisfies Partial<Record<ProviderId, true>>;

export type OfficialProvider = keyof typeof OFFICIAL_PROVIDERS;
export type SupportedProvider = OfficialProvider | EphemeralProvider;
