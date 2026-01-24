import type * as GSClient from "../client";

const UNRESTRICTED_C2S_PAYLOADS: Partial<Record<GSClient.Code, true>> = {
  Join: true,
  Leave: true,
};

export function isAuthorisedToUsePayload(
  isHost: boolean,
  payload: GSClient.Code,
) {
  return UNRESTRICTED_C2S_PAYLOADS[payload] || isHost;
}
