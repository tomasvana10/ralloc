import type { ProviderId } from "next-auth/providers";
import {
  GitHubLightLogo,
  GitHubLogo,
  GoogleLogo,
  type ProviderSVG,
} from "@/components/auth/provider-svgs";
import { cn } from "./utils";

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

export const RING_BUTTON_STYLES = cn(
  "inline-flex items-center rounded-md border border-border bg-muted px-1 py-0.5 font-mono text-sm text-muted-foreground",
  "outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "disabled:pointer-events-none disabled:opacity-50",
);
