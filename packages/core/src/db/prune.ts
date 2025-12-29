import { pruneUserData as pruneUserGroupSessionData } from "./group-session/prune";

/**
 * Toplevel database user pruning function
 */
export async function pruneUserData(hostId: string) {
  await pruneUserGroupSessionData(hostId);
}
