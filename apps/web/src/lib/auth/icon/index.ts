"use client";

import { GUEST_PROVIDER, type SupportedProvider } from "@core/auth/provider";
import type React from "react";
import * as GitHubIcon from "./github";
import * as GoogleIcon from "./google";

export type ProviderIconProps = React.SVGProps<SVGSVGElement>;
export type ProviderSVG = React.FC<ProviderIconProps>;

export interface ProviderIconData {
  defaultIcon: ProviderSVG | null;
  darkIcon: ProviderSVG | null;
}

/**
 * @remarks
 * Declare your provider icons here.
 *
 * @example
 * ```ts
 * import * as AppleIcon from "./apple"
 *
 * export const PROVIDER_ICON_DATA = {
 *   // ...
 *   apple: {
 *     defaultIcon: AppleIcon.Default,
 *     darkIcon: AppleIcon.Dark
 *   }
 * }
 * ```
 */
export const PROVIDER_ICON_DATA = {
  google: {
    defaultIcon: GoogleIcon.Default,
    darkIcon: null,
  },
  github: {
    defaultIcon: GitHubIcon.Default,
    darkIcon: GitHubIcon.Dark,
  },
  [GUEST_PROVIDER]: { defaultIcon: null, darkIcon: null },
} as const satisfies Partial<Record<SupportedProvider, ProviderIconData>>;

export { ProviderIcon } from "./icon";
