import type { ProviderId } from "next-auth/providers";
import {
  GitHubLightLogo,
  GitHubLogo,
  GoogleLogo,
  type ProviderSVG,
} from "@/components/provider-svgs";

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
