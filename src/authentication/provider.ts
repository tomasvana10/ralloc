import type { ProviderId } from "next-auth/providers";

export const GUEST_PROVIDER = "guest";
export type GuestProvider = typeof GUEST_PROVIDER;

export const OFFICIAL_PROVIDERS = {
  google: true,
  github: true,
} as const satisfies Partial<Record<ProviderId, true>>;

export type OfficialProvider = keyof typeof OFFICIAL_PROVIDERS;
export type SupportedProvider = OfficialProvider | GuestProvider;
